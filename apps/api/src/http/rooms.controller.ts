import { MintRoomId } from '@fedora-meetings/api-application';
import { Controller, HttpCode, Post } from '@nestjs/common';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly mintRoomId: MintRoomId) {}

  @Post()
  @HttpCode(201)
  mint(): { roomId: string } {
    return { roomId: this.mintRoomId.execute() };
  }
}
