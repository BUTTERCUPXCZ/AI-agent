import { Injectable } from '@nestjs/common';
import { girlfriendScript } from '../../scripts/girlfriend.script';

@Injectable()
export class ScriptsManager {
  private index = 0;

  getNext(): string | null {
    if (this.index >= girlfriendScript.length) return null;
    return girlfriendScript[this.index++];
  }

  reset() {
    this.index = 0;
  }
}
