from fpdf import FPDF
from datetime import date

class ReporteInstitucionalPDF(FPDF):
    def __init__(self, titulo_reporte: str):
        super().__init__()
        self.titulo_reporte = titulo_reporte

    def header(self):
        self.set_font("Helvetica", "B", 13)
        self.cell(0, 7, "I.S.F.D. 'Juan García de Cossio' - San Roque, Corrientes", ln=True, align="C")
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 7, self.titulo_reporte, ln=True, align="C")
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 5, f"Fecha de emisión: {date.today().strftime('%d/%m/%Y')}", ln=True, align="R")
        self.ln(4)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Sistema de Gestión Escolar PWA - Página {self.page_no()}", align="C")

def generar_pdf_asistencia_curso(curso_nombre: str, filas_alumnos: list) -> bytes:
    pdf = ReporteInstitucionalPDF(f"Planilla de Asistencia y Regularidad - {curso_nombre}")
    pdf.add_page()

    # Encabezados de tabla
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(220, 230, 241)
    pdf.cell(25, 8, "DNI", border=1, fill=True, align="C")
    pdf.cell(75, 8, "Apellido y Nombre", border=1, fill=True)
    pdf.cell(25, 8, "Clases", border=1, fill=True, align="C")
    pdf.cell(30, 8, "% Asistencia", border=1, fill=True, align="C")
    pdf.cell(35, 8, "Condición", border=1, fill=True, align="C")
    pdf.ln()

    # Filas de datos
    pdf.set_font("Helvetica", "", 9)
    for fila in filas_alumnos:
        pdf.cell(25, 7, str(fila["dni"]), border=1, align="C")
        pdf.cell(75, 7, fila["alumno"][:38], border=1)
        pdf.cell(25, 7, str(fila["total_clases"]), border=1, align="C")
        pdf.cell(30, 7, f"{fila['porcentaje']}%", border=1, align="C")
        pdf.cell(35, 7, fila["condicion"], border=1, align="C")
        pdf.ln()

    return bytes(pdf.output())

def generar_pdf_libro_temas(asignatura_nombre: str, curso_nombre: str, docente_nombre: str, temas: list) -> bytes:
    pdf = ReporteInstitucionalPDF(f"Libro de Temas Digital - {asignatura_nombre}")
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, f"Curso: {curso_nombre}   |   Docente: {docente_nombre}", ln=True)
    pdf.ln(3)

    if not temas:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 10, "No se registran clases cargadas hasta la fecha.", ln=True)
        return bytes(pdf.output())

    for t in temas:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(235, 235, 235)
        pdf.cell(0, 7, f"Fecha: {t['fecha']}  |  Unidad: {t['unidad_didactica']}  |  Eje: {t['eje_tematico']}", border=1, fill=True, ln=True)
        
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 6, f"Contenidos: {t['contenidos_dictados']}", border="LR")
        
        if t.get("observaciones_pedagogicas"):
            pdf.set_font("Helvetica", "I", 8)
            pdf.multi_cell(0, 5, f"Observaciones: {t['observaciones_pedagogicas']}", border="LRB")
        else:
            pdf.cell(0, 1, "", border="T", ln=True)
        pdf.ln(3)

    return bytes(pdf.output())