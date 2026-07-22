import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'zhishentang-api',
      version: '1.0.0',
      status: 'running',
    };
  }
}
