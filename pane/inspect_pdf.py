import PyPDF2
path=r"c:\Users\picking-beo\Desktop\gestionale pane\PANE WEBnotte.pdf"
reader=PyPDF2.PdfReader(path)
for i,page in enumerate(reader.pages):
    text=page.extract_text()
    print('--- page',i,'---')
    if text:
        print(text[:2000])
