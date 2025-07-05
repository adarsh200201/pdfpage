
import sys
import os
try:
    from pdf2docx import Converter

    pdf_file = sys.argv[1]
    docx_file = sys.argv[2]

    cv = Converter(pdf_file)
    cv.convert(docx_file, start=0, end=None)
    cv.close()

    print("SUCCESS: PDF to DOCX conversion completed")
except ImportError:
    print("ERROR: pdf2docx library not installed")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
