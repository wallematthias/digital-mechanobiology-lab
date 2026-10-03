import unittest
import numpy as np
import SimpleITK as sitk
import render_bone


class AlignmentTests(unittest.TestCase):
    def test_grid_preserves_zyx_voxel_location(self):
        a = np.zeros((3, 4, 5), dtype=np.float32)
        a[1, 2, 3] = 17
        grid = render_bone.grid_from_array(a, (0.1, 0.2, 0.3))
        point = np.flatnonzero(grid['value'] == 17)[0]
        np.testing.assert_allclose(grid.points[point], [0.3, 0.4, 0.3])

    def test_rejects_nonmatching_fea_support(self):
        a = np.zeros((3, 4, 5), dtype=bool)
        b = a.copy()
        a[0, 0, 0] = True
        b[2, 3, 4] = True
        with self.assertRaises(ValueError):
            render_bone.check_support(a, b)


if __name__ == '__main__':
    unittest.main()
