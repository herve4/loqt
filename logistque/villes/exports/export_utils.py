import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import openpyxl
from docx import Document

def export_villes_to_pdf(villes):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    
    data = [["Nom", "Région"]]
    for ville in villes:
        data.append([ville.nom, ville.region.nom])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    doc.build([table])
    buffer.seek(0)
    return buffer

def export_villes_to_excel(villes):
    buffer = io.BytesIO()
    wb = openpyxl.Workbook()
    ws = wb.active
    
    ws.append(["Nom", "Région"])
    for ville in villes:
        ws.append([ville.nom, ville.region.nom])
    
    wb.save(buffer)
    buffer.seek(0)
    return buffer

def export_villes_to_word(villes):
    buffer = io.BytesIO()
    doc = Document()
    
    table = doc.add_table(rows=1, cols=2)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Nom'
    hdr_cells[1].text = 'Région'
    
    for ville in villes:
        row_cells = table.add_row().cells
        row_cells[0].text = ville.nom
        row_cells[1].text = ville.region.nom
    
    doc.save(buffer)
    buffer.seek(0)
    return buffer