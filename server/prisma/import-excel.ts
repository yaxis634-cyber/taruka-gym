import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  'N° Socio': number;
  'Nombre': string;
  'Inscripción': string;
  'Estado': string;
  'MATRÍCULA': string;
  'Acepta Contrato': string;
  'Email': string;
  'RUT/DNI': string;
  'Fecha Nacimiento': string;
  'Dirección': string;
  'Teléfono': string;
  'Teléfono Emergencia': string;
  'Sexo': string;
  'Observación': string;
  'Estatura': string;
  'Carrera': string;
}

function mapearEstado(estado: string): string {
  const est = estado?.toLowerCase().trim() || '';
  if (est === 'activo') return 'activo';
  if (est === 'congelado' || est === 'congelada') return 'congelado';
  if (est === 'suspendido') return 'suspendido';
  return 'inactivo';
}

function generarCodigoUnico(numeroSocio: number): string {
  const base = uuidv4().replace(/-/g, '');
  return `TK${numeroSocio}-${base.substring(0, 6)}`.toUpperCase();
}

function parseFecha(valor: any): Date | null {
  if (!valor) return null;

  if (typeof valor === 'number') {
    const date = XLSX.SSF.parse_date_code(valor);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }

  if (typeof valor === 'string') {
    const partes = valor.split(/[\/\-]/);
    if (partes.length === 3) {
      const d = parseInt(partes[0]);
      const m = parseInt(partes[1]) - 1;
      const a = parseInt(partes[2]);
      if (!isNaN(d) && !isNaN(m) && !isNaN(a)) {
        if (a < 100) return new Date(a + 2000, m, d);
        return new Date(a, m, d);
      }
    }
    const parsed = new Date(valor);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function limpiarTexto(valor: any): string {
  if (!valor) return '';
  return String(valor).trim();
}

async function importar() {
  const excelPath = path.join(__dirname, '..', '..', 'alumnos', 'clientes_boxmagic_2026-07-16.xlsx');

  console.log('Leyendo archivo:', excelPath);
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Total registros en Excel: ${rows.length}`);

  let importados = 0;
  let errores = 0;

  for (const row of rows) {
    try {
      const numeroSocio = row['N° Socio'] ? Number(row['N° Socio']) : null;
      const nombre = limpiarTexto(row['Nombre']);
      const rut = limpiarTexto(row['RUT/DNI']);
      const email = limpiarTexto(row['Email']);
      const telefono = limpiarTexto(row['Teléfono']);
      const telefonoEmergencia = limpiarTexto(row['Teléfono Emergencia']);
      const direccion = limpiarTexto(row['Dirección']);
      const sexo = limpiarTexto(row['Sexo']);
      const observacion = limpiarTexto(row['Observación']);
      const fechaNacimiento = parseFecha(row['Fecha Nacimiento']);
      const estado = mapearEstado(row['Estado']);

      if (!nombre) {
        errores++;
        continue;
      }

      const codigoUnico = numeroSocio
        ? generarCodigoUnico(numeroSocio)
        : uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

      const ahora = new Date();
      const fechaTermino = estado === 'activo'
        ? new Date(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate())
        : new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate());

      const existing = await prisma.socio.findFirst({
        where: numeroSocio ? { numeroSocio } : { nombre, email: email || undefined },
      });

      if (existing) {
        await prisma.socio.update({
          where: { id: existing.id },
          data: {
            nombre,
            email: email || null,
            telefono: telefono || null,
            contactoEmergencia: telefonoEmergencia || null,
            direccion: direccion || null,
            sexo: sexo || null,
            observaciones: observacion || null,
            fechaNacimiento,
            rut: rut || null,
            estado,
          },
        });
        console.log(`  Actualizado: ${nombre} (${numeroSocio})`);
      } else {
        await prisma.socio.create({
          data: {
            codigoUnico,
            numeroSocio,
            nombre,
            rut: rut || null,
            email: email || null,
            telefono: telefono || null,
            contactoEmergencia: telefonoEmergencia || null,
            direccion: direccion || null,
            sexo: sexo || null,
            observaciones: observacion || null,
            fechaNacimiento,
            fechaInicio: ahora,
            fechaTermino,
            estado,
          },
        });
        console.log(`  Creado: ${nombre} (${numeroSocio})`);
      }

      importados++;
    } catch (err: any) {
      errores++;
      console.error(`  ERROR en ${row['Nombre']}: ${err.message}`);
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Importados: ${importados}`);
  console.log(`Errores: ${errores}`);
}

importar()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
