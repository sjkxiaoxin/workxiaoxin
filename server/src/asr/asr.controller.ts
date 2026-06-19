import { Controller, Post, UseInterceptors, UploadedFile, HttpCode, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AsrService } from './asr.service'
import * as fs from 'fs'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination?: string
  filename?: string
  path?: string
  buffer?: Buffer
}

@Controller('asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  /**
   * 上传音频文件并进行语音识别
   * 接收WAV格式音频文件（16kHz采样率，单声道）
   */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAndRecognize(@UploadedFile() file: MulterFile) {
    console.log('接收到音频文件:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      path: file?.path,
      hasBuffer: !!file?.buffer
    })

    // CRITICAL: 验证音频文件
    if (!file) {
      throw new BadRequestException('未接收到音频文件')
    }

    // 获取音频数据（同时支持小程序file.path和H5 file.buffer）
    let audioBuffer: Buffer
    
    if (file.path) {
      // 小程序端：从临时文件路径读取
      try {
        audioBuffer = fs.readFileSync(file.path)
        console.log('从文件路径读取音频数据，长度:', audioBuffer.length)
      } catch (error) {
        console.error('读取音频文件失败:', error)
        throw new BadRequestException('读取音频文件失败')
      }
    } else if (file.buffer) {
      // H5端：直接使用buffer
      audioBuffer = file.buffer
      console.log('使用buffer音频数据，长度:', audioBuffer.length)
    } else {
      throw new BadRequestException('无法获取音频数据')
    }

    // 验证音频数据有效性
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new BadRequestException('音频数据为空')
    }

    // 验证音频大小（最小1KB，最大10MB）
    if (audioBuffer.length < 1024) {
      throw new BadRequestException('音频数据太小，请录制更长的音频')
    }
    
    if (audioBuffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('音频文件太大，请录制较短的音频')
    }

    // 转换为base64
    const audioBase64 = audioBuffer.toString('base64')
    console.log('音频base64长度:', audioBase64.length)

    // 调用ASR服务进行语音识别
    try {
      const result = await this.asrService.recognize(audioBase64)
      
      console.log('ASR识别结果:', result)
      
      return {
        code: 200,
        msg: 'success',
        data: {
          text: result.text || '',
          duration: result.duration || 0,
          audioSize: audioBuffer.length,
          audioFormat: file.mimetype || 'audio/wav'
        }
      }
    } catch (error: any) {
      console.error('ASR识别失败:', error.message || error)
      
      // 提供详细的错误信息
      const errorMessage = error.message || '语音识别失败，请重试'
      
      throw new BadRequestException(errorMessage)
    }
  }
}