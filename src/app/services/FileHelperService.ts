import { Injectable } from '@angular/core';
import { FileService } from 'src/app/services/FileService';

let TAG: string = 'Feeds-FileHelperService';
let carrierPath: string = '/carrier/';
@Injectable()
export class FileHelperService {
  constructor(private fileService: FileService) { }

  moveCarrierData(oldName: string, newName: string): Promise<Entry> {
    return new Promise(async (resolve, reject) => {
      try {
        let carrierDirEntry = await this.getCarrierDirEntry();
        let carrierOldDataDirEntry = await this.fileService.getDirectory(
          carrierDirEntry,
          oldName,
        );
        let newEntry = await this.fileService.moveTo(
          carrierOldDataDirEntry,
          carrierDirEntry,
          newName,
        );
        resolve(newEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getCarrierDirEntry(): Promise<DirectoryEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        let carrierDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          carrierPath,
        );
        resolve(carrierDirEntry);
      } catch (error) {
        reject(error);
      }
    });
  }
}
