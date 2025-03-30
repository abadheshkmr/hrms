import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BusinessInfo } from './business-info.entity';
import { RegistrationInfo } from './registration-info.entity';
import { VerificationInfo } from './verification-info.entity';
import { VerificationStatus } from '../../enums/tenant.enums';

describe('Embedded Tenant Entities', () => {
  describe('BusinessInfo', () => {
    it('should validate a properly formatted business info', async () => {
      const businessInfo = plainToInstance(BusinessInfo, {
        industry: 'Information Technology',
        description: 'Software development company',
        employeeCount: 50,
        foundedDate: new Date('2020-01-01'),
      });

      const errors = await validate(businessInfo);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid employee count values', async () => {
      const businessInfo = plainToInstance(BusinessInfo, {
        industry: 'Information Technology',
        employeeCount: -10, // Invalid negative value
      });

      const errors = await validate(businessInfo);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('employeeCount');
    });

    it('should enforce string length restrictions', async () => {
      const businessInfo = plainToInstance(BusinessInfo, {
        industry: 'A', // Too short (min 2 chars)
        description: 'A'.repeat(1001), // Too long (max 1000 chars)
      });

      const errors = await validate(businessInfo);
      expect(errors).toHaveLength(2);
      
      const propertyErrors = errors.map((err) => err.property);
      expect(propertyErrors).toContain('industry');
      expect(propertyErrors).toContain('description');
    });
  });

  describe('RegistrationInfo', () => {
    it('should validate properly formatted registration numbers', async () => {
      const registrationInfo = plainToInstance(RegistrationInfo, {
        cinNumber: 'U72200TN2021PTC141323',
        panNumber: 'AAAPL1234C',
        gstNumber: '33AAAPL1234C1Z5',
        tanNumber: 'CHEM12345A',
        msmeNumber: 'UDYAM-TN-01-0000001',
      });

      const errors = await validate(registrationInfo);
      expect(errors).toHaveLength(0);
    });

    it('should reject improperly formatted registration numbers', async () => {
      const registrationInfo = plainToInstance(RegistrationInfo, {
        cinNumber: 'INVALID12345', // Invalid format
        panNumber: '12345ABCDE', // Invalid format
        gstNumber: 'INVALID-GST', // Invalid format
      });

      const errors = await validate(registrationInfo);
      expect(errors).toHaveLength(3);
    });

    it('should check if registration is complete', () => {
      const completeRegistration = new RegistrationInfo();
      completeRegistration.cinNumber = 'U72200TN2021PTC141323';
      
      const incompleteRegistration = new RegistrationInfo();
      
      expect(completeRegistration.isRegistrationComplete()).toBe(true);
      expect(incompleteRegistration.isRegistrationComplete()).toBe(false);
    });

    it('should format registration numbers correctly', () => {
      const registrationInfo = new RegistrationInfo();
      registrationInfo.panNumber = 'aaapl1234c'; // lowercase
      registrationInfo.gstNumber = '33aaapl1234c1z5'; // lowercase
      
      expect(registrationInfo.getFormattedRegistrationNumber('PAN')).toBe(
        'AAAPL1234C',
      );
      expect(registrationInfo.getFormattedRegistrationNumber('GST')).toBe(
        '33AAAPL1234C1Z5',
      );
      expect(registrationInfo.getFormattedRegistrationNumber('CIN')).toBeNull();
    });
  });

  describe('VerificationInfo', () => {
    it('should initialize with default values', () => {
      const verificationInfo = new VerificationInfo();
      expect(verificationInfo.verificationStatus).toBe(
        VerificationStatus.PENDING,
      );
      expect(verificationInfo.verificationAttempted).toBe(false);
    });

    it('should manage verification documents correctly', () => {
      const verificationInfo = new VerificationInfo();
      
      // Initially empty
      expect(verificationInfo.getVerificationDocuments()).toEqual([]);
      
      // Add documents
      verificationInfo.addVerificationDocument('doc-001');
      verificationInfo.addVerificationDocument('doc-002');
      
      expect(verificationInfo.getVerificationDocuments()).toEqual(['doc-001', 'doc-002']);
      
      // No duplicates
      verificationInfo.addVerificationDocument('doc-001');
      expect(verificationInfo.getVerificationDocuments()).toEqual([
        'doc-001',
        'doc-002',
      ]);
    });

    it('should properly check verification completion', () => {
      const pendingVerification = new VerificationInfo();
      pendingVerification.verificationStatus = VerificationStatus.PENDING;
      
      const verifiedVerification = new VerificationInfo();
      verifiedVerification.verificationStatus = VerificationStatus.VERIFIED;
      
      expect(pendingVerification.isVerificationComplete()).toBe(false);
      expect(verifiedVerification.isVerificationComplete()).toBe(true);
    });

    it('should validate verification data properly', async () => {
      const verificationInfo = plainToInstance(VerificationInfo, {
        verificationStatus: 'INVALID', // Invalid enum value
        verifiedById: 'not-a-uuid', // Invalid UUID
        verificationNotes: 'A'.repeat(1001), // Too long
      });

      const errors = await validate(verificationInfo);
      expect(errors.length).toBeGreaterThan(0);
      
      const propertyErrors = errors.map((err) => err.property);
      expect(propertyErrors).toContain('verificationStatus');
      expect(propertyErrors).toContain('verifiedById');
      expect(propertyErrors).toContain('verificationNotes');
    });
  });
});
