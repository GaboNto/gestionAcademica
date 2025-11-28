import { 
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ActividadPracticaService } from './actividad-practica.service';
import { CreateActividadPracticaDto } from './dto/crear-act-practica.dto';
import { UpdateActividadPracticaDto } from './dto/actualizar-act-practica.dto';
import { QueryActividadPracticaDto } from './dto/consulta-act-practica.dto';

@Controller('actividad-practica')
export class ActividadPracticaController {
  constructor(private readonly service: ActividadPracticaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/actividades',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname); // .pdf o .png
          cb(null, `actividad-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 👉 Validar por EXTENSIÓN, no por mimetype
        const extension = extname(file.originalname).toLowerCase();
        const allowed = ['.pdf', '.png', '.zip'];

        console.log('DEBUG archivo POST =>', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          extension,
        });

        if (!allowed.includes(extension)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF, PNG o ZIP'),
            false,
          );
        }

        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB (aumentado para ZIPs)
    }),
  )
  create(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: CreateActividadPracticaDto,
  ) {
    const evidenciaUrl = archivo
      ? `uploads/actividades/${archivo.filename}`
      : dto.evidenciaUrl;

    const dtoConArchivo: CreateActividadPracticaDto = {
      ...dto,
      evidenciaUrl,
    };

    return this.service.create(dtoConArchivo);
  }

  @Get()
  findAll(@Query() q: QueryActividadPracticaDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/actividades',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `actividad-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const extension = extname(file.originalname).toLowerCase();
        const allowed = ['.pdf', '.png', '.zip'];

        console.log('DEBUG archivo PATCH =>', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          extension,
        });

        if (!allowed.includes(extension)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF, PNG o ZIP'),
            false,
          );
        }

        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB (aumentado para ZIPs)
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: UpdateActividadPracticaDto,
  ) {
    const evidenciaUrl = archivo
      ? `uploads/actividades/${archivo.filename}`
      : dto.evidenciaUrl;

    const dtoConArchivo: UpdateActividadPracticaDto = {
      ...dto,
      evidenciaUrl,
    };

    return this.service.update(id, dtoConArchivo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
