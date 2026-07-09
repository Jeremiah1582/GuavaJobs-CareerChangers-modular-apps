import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { CvService } from './cv.service';

@ApiTags('cv')
@ApiBearerAuth()
@Controller('profiles/:profileId/cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  @ApiOperation({ summary: 'Upload CV (PDF/DOCX); replaces active CV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cvService.uploadCv(user.id, profileId, file);
  }

  @Get('download')
  @ApiOperation({ summary: 'Signed URL for current CV download' })
  download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.cvService.getDownloadUrl(user.id, profileId);
  }
}
