// pdf-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-pdf-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <iframe
        [src]="safeUrl"
        style="width:100%;height:75vh;border:1px solid #e5e7eb;border-radius:8px"
      ></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class PdfDialogComponent {
  safeUrl: SafeResourceUrl;
  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: { dataUrl: string; title: string }
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.data.dataUrl
    );
  }
}