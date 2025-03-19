import { describe, it, expect, beforeEach, vi } from "vitest"
import { mockClarity } from "./helpers/mock-clarity"

// Mock the Clarity contract
const driverVerification = mockClarity("driver-verification")

describe("Driver Verification Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
    vi.clearAllMocks()
  })
  
  describe("register-driver", () => {
    it("should register a new driver successfully", () => {
      // Arrange
      const name = "John Doe"
      const licenseNumber = "DL12345678"
      const licenseExpiry = 1735689600 // January 1, 2025
      const qualifications = ["CDL Class B", "First Aid Certified"]
      const backgroundCheckDate = 1672531200 // January 1, 2023
      
      // Mock the next-driver-id variable
      driverVerification.varGet.mockReturnValueOnce(1)
      
      // Act
      const result = driverVerification.registerDriver(
          name,
          licenseNumber,
          licenseExpiry,
          qualifications,
          backgroundCheckDate,
      )
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(1)
      expect(driverVerification.mapSet).toHaveBeenCalledWith(
          { driver_id: 1 },
          {
            name,
            license_number: licenseNumber,
            license_expiry: licenseExpiry,
            qualifications,
            active: true,
            safety_score: 100,
            last_background_check: backgroundCheckDate,
          },
      )
      expect(driverVerification.varSet).toHaveBeenCalledWith(2)
    })
  })
  
  describe("update-driver-license", () => {
    it("should update a driver license successfully", () => {
      // Arrange
      const driverId = 1
      const licenseNumber = "DL87654321"
      const licenseExpiry = 1767225600 // January 1, 2026
      
      // Mock the map-get? function to return an existing driver
      driverVerification.mapGet.mockReturnValueOnce({
        name: "John Doe",
        license_number: "DL12345678",
        license_expiry: 1735689600,
        qualifications: ["CDL Class B", "First Aid Certified"],
        active: true,
        safety_score: 100,
        last_background_check: 1672531200,
      })
      
      // Act
      const result = driverVerification.updateDriverLicense(driverId, licenseNumber, licenseExpiry)
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(true)
      expect(driverVerification.mapSet).toHaveBeenCalledWith(
          { driver_id: driverId },
          expect.objectContaining({
            license_number: licenseNumber,
            license_expiry: licenseExpiry,
          }),
      )
    })
    
    it("should return an error when updating a non-existent driver", () => {
      // Arrange
      const driverId = 999
      const licenseNumber = "DL87654321"
      const licenseExpiry = 1767225600
      
      // Mock the map-get? function to return none
      driverVerification.mapGet.mockReturnValueOnce(null)
      
      // Act
      const result = driverVerification.updateDriverLicense(driverId, licenseNumber, licenseExpiry)
      
      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toBe(1)
      expect(driverVerification.mapSet).not.toHaveBeenCalled()
    })
  })
  
  describe("record-safety-incident", () => {
    it("should record a safety incident and update safety score", () => {
      // Arrange
      const driverId = 1
      const description = "Minor traffic violation"
      const severity = 5
      const timestamp = 1693526400 // September 1, 2023
      
      // Mock the next-incident-id variable
      driverVerification.varGet.mockReturnValueOnce(1)
      
      // Mock the map-get? function to return an existing driver
      driverVerification.mapGet.mockReturnValueOnce({
        name: "John Doe",
        license_number: "DL12345678",
        license_expiry: 1735689600,
        qualifications: ["CDL Class B", "First Aid Certified"],
        active: true,
        safety_score: 100,
        last_background_check: 1672531200,
      })
      
      // Act
      const result = driverVerification.recordSafetyIncident(driverId, description, severity, timestamp)
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(1)
      
      // Check that the incident was recorded
      expect(driverVerification.mapSet).toHaveBeenCalledWith(
          { incident_id: 1 },
          {
            driver_id: driverId,
            timestamp,
            description,
            severity,
            resolved: false,
          },
      )
      
      // Check that the safety score was updated (100 - 15 = 85 for severity 5)
      expect(driverVerification.mapSet).toHaveBeenCalledWith(
          { driver_id: driverId },
          expect.objectContaining({
            safety_score: 85,
          }),
      )
      
      expect(driverVerification.varSet).toHaveBeenCalledWith(2)
    })
    
    it("should return an error when recording an incident for a non-existent driver", () => {
      // Arrange
      const driverId = 999
      const description = "Minor traffic violation"
      const severity = 5
      const timestamp = 1693526400
      
      // Mock the map-get? function to return none
      driverVerification.mapGet.mockReturnValueOnce(null)
      
      // Act
      const result = driverVerification.recordSafetyIncident(driverId, description, severity, timestamp)
      
      // Assert
      expect(result.isOk).toBe(false)
      expect(result.error).toBe(1)
      expect(driverVerification.mapSet).not.toHaveBeenCalled()
    })
  })
  
  describe("check-driver-eligibility", () => {
    it("should return true for an eligible driver", () => {
      // Arrange
      const driverId = 1
      const currentTime = 1693526400 // September 1, 2023
      
      // Mock the map-get? function to return an eligible driver
      driverVerification.mapGet.mockReturnValueOnce({
        name: "John Doe",
        license_number: "DL12345678",
        license_expiry: 1735689600, // January 1, 2025 (future)
        qualifications: ["CDL Class B", "First Aid Certified"],
        active: true,
        safety_score: 90, // Above threshold
        last_background_check: 1672531200, // January 1, 2023 (less than a year ago)
      })
      
      // Act
      const result = driverVerification.checkDriverEligibility(driverId, currentTime)
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(true)
    })
    
    it("should return false for a driver with expired license", () => {
      // Arrange
      const driverId = 1
      const currentTime = 1693526400 // September 1, 2023
      
      // Mock the map-get? function to return a driver with expired license
      driverVerification.mapGet.mockReturnValueOnce({
        name: "John Doe",
        license_number: "DL12345678",
        license_expiry: 1672531200, // January 1, 2023 (past)
        qualifications: ["CDL Class B", "First Aid Certified"],
        active: true,
        safety_score: 90,
        last_background_check: 1672531200,
      })
      
      // Act
      const result = driverVerification.checkDriverEligibility(driverId, currentTime)
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(false)
    })
    
    it("should return false for a driver with low safety score", () => {
      // Arrange
      const driverId = 1
      const currentTime = 1693526400
      
      // Mock the map-get? function to return a driver with low safety score
      driverVerification.mapGet.mockReturnValueOnce({
        name: "John Doe",
        license_number: "DL12345678",
        license_expiry: 1735689600,
        qualifications: ["CDL Class B", "First Aid Certified"],
        active: true,
        safety_score: 65, // Below threshold
        last_background_check: 1672531200,
      })
      
      // Act
      const result = driverVerification.checkDriverEligibility(driverId, currentTime)
      
      // Assert
      expect(result.isOk).toBe(true)
      expect(result.value).toBe(false)
    })
  })
})

