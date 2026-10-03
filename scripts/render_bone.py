"""Private, deterministic CT/longitudinal/FEA website-art preview.

No scan headers or source metadata are embedded in the exported images.
Requires numpy, SimpleITK, pyvista, matplotlib, pillow and py_aimio.
"""
import argparse
import json
from pathlib import Path
import numpy as np
import SimpleITK as sitk
import pyvista as pv
from PIL import Image


def grid_from_array(array, spacing):
    grid = pv.ImageData(dimensions=array.shape[::-1], spacing=spacing)
    grid['value'] = array.transpose(2, 1, 0).ravel(order='F')
    return grid


def check_support(material, segmentation):
    if material.shape != segmentation.shape:
        raise ValueError('FEA and reference support dimensions differ')
    denominator = np.count_nonzero(material) + np.count_nonzero(segmentation)
    dice = 2 * np.count_nonzero(material & segmentation) / max(denominator, 1)
    if dice < 0.98:
        raise ValueError(f'Index alignment not supported: Dice {dice:.4f}')
    return float(dice)


def main():
    from py_aimio import read_image
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, required=True)
    parser.add_argument('--derivatives', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    density, meta = read_image(str(args.baseline), density=True)
    ref = sitk.GetImageFromArray(density)
    ref.SetSpacing(meta['spacing'])
    ref.SetOrigin(meta['origin'])
    ref.SetDirection(meta['direction'])
    root = args.derivatives
    fea = next((root / 'FEA/sub-001/xct/runs').glob('*/fields/sed.nii.gz'))
    material = sitk.GetArrayFromImage(sitk.ReadImage(str(fea.parent.parent / 'model/material.nii.gz')))
    seg_path = next((root / 'Timelapse/sub-001/ses-001/xct/transformed').glob('*desc-seg*'))
    seg = sitk.ReadImage(str(seg_path))
    seg = sitk.GetArrayFromImage(sitk.Resample(seg, ref, sitk.Transform(), sitk.sitkNearestNeighbor, 0))
    dice = check_support(material > 0, seg > 0)
    rem_path = next((root / 'Timelapse/sub-001/xct/analysis/visualize').glob('*remodelling.nii.gz'))
    rem_img = sitk.ReadImage(str(rem_path))
    rem = sitk.GetArrayFromImage(sitk.Resample(rem_img, ref, sitk.Transform(), sitk.sitkNearestNeighbor, 0))
    sed = sitk.GetArrayFromImage(sitk.ReadImage(str(fea)))
    assert sed.shape == density.shape
    assert np.isfinite(sed).all()
    spacing = meta['spacing']
    grid = grid_from_array((material > 0).astype(np.float32), spacing)
    grid['density'] = density.transpose(2, 1, 0).ravel(order='F')
    grid['sed'] = sed.transpose(2, 1, 0).ravel(order='F')
    surface = grid.contour([0.5], scalars='value').smooth(n_iter=12, relaxation_factor=0.08)
    center = np.asarray(surface.center)
    # Remove a wedge of the cortical shell, exposing the measured trabecular network.
    surface = surface.clip(normal=(0, -1, 0), origin=center + [0, -3, 0], invert=False)
    p95 = float(np.percentile(sed[material > 0], 95))
    outputs = []
    for mode in ['baseline', 'remodelling', 'fea']:
        plotter = pv.Plotter(off_screen=True, window_size=(1200, 1200))
        plotter.set_background('#17191c')
        common = dict(show_scalar_bar=False, smooth_shading=True, ambient=0.48,
                      diffuse=0.72, specular=0.22, specular_power=25)
        if mode == 'fea':
            plotter.add_mesh(surface, scalars='sed', cmap='jet', clim=(0, p95), **common)
        else:
            plotter.add_mesh(surface, scalars='density', cmap='gray', clim=(0, 750), **common)
        if mode == 'remodelling':
            for label, color in [(1, '#e53652'), (3, '#ffcf54')]:
                event = grid_from_array((rem == label).astype(np.float32), spacing)
                event = event.contour([0.5]).smooth(n_iter=8, relaxation_factor=0.06)
                event = event.clip(normal=(0, -1, 0), origin=center + [0, -3, 0], invert=False)
                plotter.add_mesh(event, color=color, **common)
        focus = np.asarray(surface.center)
        plotter.camera_position = [tuple(focus + [28, -52, 65]), tuple(focus), (0, 0, 1)]
        plotter.camera.parallel_projection = True
        plotter.camera.parallel_scale = 16
        plotter.enable_anti_aliasing('ssaa')
        target = args.out / f'bone-{mode}.png'
        plotter.screenshot(str(target))
        plotter.close()
        outputs.append(target)
        print(f'Rendered {mode}', flush=True)
    # Wide editorial plate: consistent camera, no decorative invented anatomy.
    plate = Image.new('RGB', (3000, 1050), '#17191c')
    for i, path in enumerate(outputs):
        image = Image.open(path).convert('RGB')
        image = image.resize((1000, 1000), Image.Resampling.LANCZOS)
        plate.paste(image, (i * 1000, 25))
    plate.save(args.out / 'bone-hero.png')
    plate.save(args.out / 'bone-hero.webp', quality=92)
    # Explicit interpretation, not patient or scan metadata.
    (args.out / 'render-notes.json').write_text(json.dumps({
        'public_release': 'not approved; local preview only',
        'panels': ['baseline density on FEA bone support', 'resorption red; formation gold', 'strain energy density; jet'],
        'support_dice': dice, 'fea_alignment': 'index alignment verified against registered segmentation; FEA header not used',
        'sed_display_range': [0, p95], 'sed_clipping': '95th percentile; values above limit use top colour',
        'surface': 'FEA support isosurface; lightly smoothed for display; planar cutaway',
        'units': 'density mg HA/cm3; SED units require confirmation from solver configuration',
    }, indent=2))


if __name__ == '__main__':
    main()
