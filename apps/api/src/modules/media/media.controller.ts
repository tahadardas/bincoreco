import { Controller, Post, UseGuards, UploadedFile, Query, BadRequestException, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { MediaService } from './media.service';

@Controller('admin/media')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles('admin', 'maestro')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.mediaService.upload(file, folder);
    return { success: true, data: result };
  }
}
