"""Where each official document sits inside the merged source PDFs (1-indexed, inclusive page ranges).

`f1` and `f2` are the two merged Google Drive files supplied by the developer; `y3sk` / `y3sjk` are the
separately uploaded Year 3 DSKP files. The PDFs themselves are never committed to the repository.
"""
import os

SRC = os.environ.get('CONSILIA_SRC', './src-pdfs')

SOW = [  # (file, first, last, year, school)
    ('f1', 17, 214, 1, 'SJK'), ('f1', 275, 656, 1, 'SK'),
    ('f1', 833, 1184, 2, 'SK'), ('f1', 1185, 1374, 2, 'SJK'),
    ('f1', 1593, 1858, 3, 'SK'), ('f1', 1859, 2008, 3, 'SJK'),
    ('f2', 1108, 1250, 4, 'SJK'), ('f2', 1251, 1465, 4, 'SK'),
    ('f2', 639, 782, 5, 'SJK'), ('f2', 783, 1000, 5, 'SK'),
    ('f2', 1, 149, 6, 'SJK'), ('f2', 150, 370, 6, 'SK'),
]
PHONICS = [('f1', 215, 274, 1), ('f1', 1455, 1490, 2)]
DSKP = [  # (file, first, last, year, school)
    ('f1', 657, 736, 1, 'SK'), ('f1', 737, 816, 1, 'SJK'),
    ('f1', 1375, 1454, 2, 'SK'), ('f1', 1491, 1570, 2, 'SJK'),
    ('y3sk', 1, 77, 3, 'SK'), ('y3sjk', 1, 78, 3, 'SJK'),
    ('f2', 1546, 1625, 4, 'SK'), ('f2', 1466, 1545, 4, 'SJK'),
    ('f2', 1001, 1088, 5, 'SK'), ('f2', 461, 555, 5, 'SJK'),
    ('f2', 556, 638, 6, 'SK'), ('f2', 371, 460, 6, 'SJK'),
]
