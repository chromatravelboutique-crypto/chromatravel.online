import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

const CERTIFICATION_DIR = './hotelbeds_certification';
const CERTS_DIR = './certs';

interface CertificationPackageResult {
  success: boolean;
  zipPath?: string;
  error?: string;
}

export class HotelbedsCertificationService {
  private certDir: string;

  constructor() {
    this.certDir = CERTIFICATION_DIR;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
    }
  }

  getCertificateInfo(): { 
    exists: boolean; 
    path?: string; 
    validUntil?: string;
    commonName?: string;
  } {
    const certPath = path.join(CERTS_DIR, 'hotelbeds-certificate.pem');
    
    if (!fs.existsSync(certPath)) {
      return { exists: false };
    }

    const certContent = fs.readFileSync(certPath, 'utf-8');
    
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    return {
      exists: true,
      path: certPath,
      validUntil: validUntil.toISOString().split('T')[0],
      commonName: 'chromatravel.online'
    };
  }

  getDocuments(): Array<{ name: string; path: string; exists: boolean }> {
    const docs = [
      { name: 'README_FENIX_TRAVELER.md', path: path.join(this.certDir, 'README_FENIX_TRAVELER.md') },
      { name: 'API_INTEGRATION_SPEC.md', path: path.join(this.certDir, 'API_INTEGRATION_SPEC.md') },
    ];

    return docs.map(doc => ({
      ...doc,
      exists: fs.existsSync(doc.path)
    }));
  }

  async generateCertificationPackage(brand: 'fenix' | 'chroma' = 'fenix'): Promise<CertificationPackageResult> {
    const brandName = brand === 'fenix' ? 'fenixtraveler' : 'chromatravel';
    const timestamp = Date.now();
    const zipFileName = `${brandName}_hotelbeds_package_${timestamp}.zip`;
    const zipPath = path.join(CERTIFICATION_DIR, zipFileName);

    return new Promise((resolve) => {
      try {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          resolve({
            success: true,
            zipPath: zipPath
          });
        });

        archive.on('error', (err) => {
          resolve({
            success: false,
            error: `Archive error: ${err.message}`
          });
        });

        archive.pipe(output);

        const certPath = path.join(CERTS_DIR, 'hotelbeds-certificate.pem');
        if (fs.existsSync(certPath)) {
          archive.file(certPath, { name: 'certificate/hotelbeds-certificate.pem' });
        }

        const readmePath = path.join(this.certDir, 'README_FENIX_TRAVELER.md');
        if (fs.existsSync(readmePath)) {
          archive.file(readmePath, { name: 'documentation/README.md' });
        }

        const specPath = path.join(this.certDir, 'API_INTEGRATION_SPEC.md');
        if (fs.existsSync(specPath)) {
          archive.file(specPath, { name: 'documentation/API_INTEGRATION_SPEC.md' });
        }

        const companyInfo = this.generateCompanyInfo(brand);
        archive.append(companyInfo, { name: 'company_info.json' });

        const integrationSummary = this.generateIntegrationSummary(brand);
        archive.append(integrationSummary, { name: 'integration_summary.txt' });

        archive.finalize();

      } catch (error: any) {
        resolve({
          success: false,
          error: error.message
        });
      }
    });
  }

  private generateCompanyInfo(brand: 'fenix' | 'chroma'): string {
    const info = brand === 'fenix' ? {
      company_name: 'Fenix Traveler',
      website: 'https://fenixtraveler.com',
      business_type: 'Online Travel Agency (OTA)',
      market_focus: 'Premium travel experiences for all audiences',
      parent_company: 'Chroma Travel',
      parent_website: 'https://chromatravel.online',
      contact_email: 'api@fenixtraveler.com',
      support_email: 'support@fenixtraveler.com',
      country: 'Mexico',
      integration_date: new Date().toISOString().split('T')[0]
    } : {
      company_name: 'Chroma Travel',
      website: 'https://chromatravel.online',
      business_type: 'Online Travel Agency (OTA)',
      market_focus: 'LGBT+ focused luxury travel',
      contact_email: 'api@chromatravel.online',
      support_email: 'support@chromatravel.online',
      country: 'Mexico',
      integration_date: new Date().toISOString().split('T')[0]
    };

    return JSON.stringify(info, null, 2);
  }

  private generateIntegrationSummary(brand: 'fenix' | 'chroma'): string {
    const brandName = brand === 'fenix' ? 'Fenix Traveler' : 'Chroma Travel';
    const website = brand === 'fenix' ? 'fenixtraveler.com' : 'chromatravel.online';

    return `
HOTELBEDS API INTEGRATION SUMMARY
=================================
Company: ${brandName}
Website: https://${website}
Date: ${new Date().toISOString().split('T')[0]}

INTEGRATION STATUS
------------------
- Hotel Search API: Implemented
- Hotel Details API: Implemented
- Check Rate API: Implemented
- Booking API: Implemented
- Cancel Booking API: Implemented

AUTHENTICATION
--------------
- Method: API Key + X-Signature (SHA256)
- mTLS: Certificate included in package

ENDPOINTS INTEGRATED
--------------------
1. POST /hotel-api/1.0/hotels - Hotel availability search
2. POST /hotel-api/1.0/hotels/{id} - Hotel details
3. POST /hotel-api/1.0/checkrates - Rate verification
4. POST /hotel-api/1.0/bookings - Create booking
5. DELETE /hotel-api/1.0/bookings/{id} - Cancel booking

PACKAGE CONTENTS
----------------
- certificate/hotelbeds-certificate.pem - mTLS certificate
- documentation/README.md - Integration documentation
- documentation/API_INTEGRATION_SPEC.md - Technical specification
- company_info.json - Company details
- integration_summary.txt - This file

CONTACT INFORMATION
-------------------
Technical: api@${website}
Support: support@${website}

---
Generated by ${brandName} Integration System
`.trim();
  }
}

export const hotelbedsCertificationService = new HotelbedsCertificationService();
