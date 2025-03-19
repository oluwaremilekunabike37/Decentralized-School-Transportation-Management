import { vi } from "vitest"

/**
 * Creates a mock for a Clarity contract with common functions
 * @param contractName The name of the contract to mock
 * @returns A mock object with common Clarity contract functions
 */
export function mockClarity(contractName: string) {
	return {
		// Map operations
		mapGet: vi.fn(),
		mapSet: vi.fn(),
		mapDelete: vi.fn(),
		
		// Variable operations
		varGet: vi.fn(),
		varSet: vi.fn(),
		
		// Block info
		getBlockInfo: vi.fn(),
		
		// Contract-specific functions for route-optimization.clar
		createRoute: vi.fn().mockImplementation((name, stops, distance, estimatedDuration) => {
			const routeId = this.varGet()
			this.mapSet(
				{ route_id: routeId },
				{
					name,
					stops,
					distance,
					estimated_duration: estimatedDuration,
					active: true,
				},
			)
			this.varSet(routeId + 1)
			return { isOk: true, value: routeId }
		}),
		
		updateRoute: vi.fn().mockImplementation((routeId, name, stops, distance, estimatedDuration) => {
			const route = this.mapGet({ route_id: routeId })
			if (route) {
				this.mapSet(
					{ route_id: routeId },
					{
						name,
						stops,
						distance,
						estimated_duration: estimatedDuration,
						active: route.active,
					},
				)
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		deactivateRoute: vi.fn().mockImplementation((routeId) => {
			const route = this.mapGet({ route_id: routeId })
			if (route) {
				this.mapSet({ route_id: routeId }, { ...route, active: false })
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		activateRoute: vi.fn().mockImplementation((routeId) => {
			const route = this.mapGet({ route_id: routeId })
			if (route) {
				this.mapSet({ route_id: routeId }, { ...route, active: true })
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		assignRoute: vi.fn().mockImplementation((busId, day, routeId) => {
			const route = this.mapGet({ route_id: routeId })
			if (route) {
				this.mapSet({ bus_id: busId, day }, { route_id: routeId })
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		getRoute: vi.fn().mockImplementation((routeId) => {
			return this.mapGet({ route_id: routeId })
		}),
		
		getRouteAssignment: vi.fn().mockImplementation((busId, day) => {
			return this.mapGet({ bus_id: busId, day })
		}),
		
		// Contract-specific functions for driver-verification.clar
		registerDriver: vi
			.fn()
			.mockImplementation((name, licenseNumber, licenseExpiry, qualifications, backgroundCheckDate) => {
				const driverId = this.varGet()
				this.mapSet(
					{ driver_id: driverId },
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
				this.varSet(driverId + 1)
				return { isOk: true, value: driverId }
			}),
		
		updateDriverLicense: vi.fn().mockImplementation((driverId, licenseNumber, licenseExpiry) => {
			const driver = this.mapGet({ driver_id: driverId })
			if (driver) {
				this.mapSet(
					{ driver_id: driverId },
					{
						...driver,
						license_number: licenseNumber,
						license_expiry: licenseExpiry,
					},
				)
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		recordSafetyIncident: vi.fn().mockImplementation((driverId, description, severity, timestamp) => {
			const incidentId = this.varGet()
			const driver = this.mapGet({ driver_id: driverId })
			if (driver) {
				this.mapSet(
					{ incident_id: incidentId },
					{
						driver_id: driverId,
						timestamp,
						description,
						severity,
						resolved: false,
					},
				)
				
				// Calculate new safety score
				let penalty = 5
				if (severity >= 5) penalty = 15
				if (severity >= 8) penalty = 30
				
				const newScore = driver.safety_score > penalty ? driver.safety_score - penalty : 0
				
				this.mapSet(
					{ driver_id: driverId },
					{
						...driver,
						safety_score: newScore,
					},
				)
				
				this.varSet(incidentId + 1)
				return { isOk: true, value: incidentId }
			}
			return { isOk: false, error: 1 }
		}),
		
		checkDriverEligibility: vi.fn().mockImplementation((driverId, currentTime) => {
			const driver = this.mapGet({ driver_id: driverId })
			if (driver) {
				const licenseValid = driver.license_expiry > currentTime
				const backgroundCheckValid = currentTime - driver.last_background_check < 31536000 // 1 year in seconds
				const safetyScoreAcceptable = driver.safety_score >= 70
				const isActive = driver.active
				
				return { isOk: true, value: licenseValid && backgroundCheckValid && safetyScoreAcceptable && isActive }
			}
			return { isOk: false, error: 1 }
		}),
		
		// Contract-specific functions for ridership-tracking.clar
		registerStudent: vi
			.fn()
			.mockImplementation((name, grade, schoolId, busRouteId, pickupStopId, dropoffStopId, guardianPrincipal) => {
				const studentId = this.varGet()
				this.mapSet(
					{ student_id: studentId },
					{
						name,
						grade,
						school_id: schoolId,
						bus_route_id: busRouteId,
						pickup_stop_id: pickupStopId,
						dropoff_stop_id: dropoffStopId,
						guardian_principal: guardianPrincipal,
						active: true,
					},
				)
				this.varSet(studentId + 1)
				return { isOk: true, value: studentId }
			}),
		
		updateStudentRoute: vi.fn().mockImplementation((studentId, busRouteId, pickupStopId, dropoffStopId) => {
			const student = this.mapGet({ student_id: studentId })
			if (student) {
				this.mapSet(
					{ student_id: studentId },
					{
						...student,
						bus_route_id: busRouteId,
						pickup_stop_id: pickupStopId,
						dropoff_stop_id: dropoffStopId,
					},
				)
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		recordPickup: vi.fn().mockImplementation((studentId, date, pickupTime, busId, driverId) => {
			const student = this.mapGet({ student_id: studentId })
			const recordId = this.varGet()
			const summary = this.mapGet({ date, bus_id: busId })
			
			if (student && student.active) {
				// Create ridership record
				this.mapSet(
					{ record_id: recordId },
					{
						student_id: studentId,
						date,
						pickup_time: { value: pickupTime },
						dropoff_time: null,
						bus_id: busId,
						driver_id: driverId,
					},
				)
				
				// Update daily summary
				if (summary) {
					this.mapSet(
						{ date, bus_id: busId },
						{
							...summary,
							picked_up: summary.picked_up + 1,
						},
					)
				} else {
					this.mapSet(
						{ date, bus_id: busId },
						{
							total_students: 1,
							picked_up: 1,
							dropped_off: 0,
						},
					)
				}
				
				this.varSet(recordId + 1)
				return { isOk: true, value: recordId }
			}
			return { isOk: false, error: 1 }
		}),
		
		recordDropoff: vi.fn().mockImplementation((recordId, dropoffTime) => {
			const record = this.mapGet({ record_id: recordId })
			
			if (record) {
				const date = record.date
				const busId = record.bus_id
				const summary = this.mapGet({ date, bus_id: busId })
				
				// Update ridership record
				this.mapSet(
					{ record_id: recordId },
					{
						...record,
						dropoff_time: { value: dropoffTime },
					},
				)
				
				// Update daily summary
				if (summary) {
					this.mapSet(
						{ date, bus_id: busId },
						{
							...summary,
							dropped_off: summary.dropped_off + 1,
						},
					)
				} else {
					this.mapSet(
						{ date, bus_id: busId },
						{
							total_students: 1,
							picked_up: 0,
							dropped_off: 1,
						},
					)
				}
				
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		getStudent: vi.fn().mockImplementation((studentId) => {
			return this.mapGet({ student_id: studentId })
		}),
		
		getRidershipRecord: vi.fn().mockImplementation((recordId) => {
			return this.mapGet({ record_id: recordId })
		}),
		
		getDailySummary: vi.fn().mockImplementation((date, busId) => {
			return this.mapGet({ date, bus_id: busId })
		}),
		
		// Contract-specific functions for maintenance-scheduling.clar
		registerVehicle: vi
			.fn()
			.mockImplementation(
				(registration, model, year, capacity, mileage, maintenanceIntervalMiles, maintenanceIntervalDays) => {
					const vehicleId = this.varGet()
					const currentTime = this.getBlockInfo(0).value
					
					this.mapSet(
						{ vehicle_id: vehicleId },
						{
							registration,
							model,
							year,
							capacity,
							mileage,
							last_maintenance_date: currentTime,
							next_maintenance_date: currentTime + maintenanceIntervalDays * 86400,
							maintenance_interval_miles: maintenanceIntervalMiles,
							maintenance_interval_days: maintenanceIntervalDays,
							status: "active",
						},
					)
					
					this.varSet(vehicleId + 1)
					return { isOk: true, value: vehicleId }
				},
			),
		
		updateVehicleMileage: vi.fn().mockImplementation((vehicleId, newMileage) => {
			const vehicle = this.mapGet({ vehicle_id: vehicleId })
			
			if (vehicle) {
				const lastMileage = vehicle.mileage
				const maintenanceInterval = vehicle.maintenance_interval_miles
				const needsMaintenance = newMileage - lastMileage >= maintenanceInterval
				
				this.mapSet(
					{ vehicle_id: vehicleId },
					{
						...vehicle,
						mileage: newMileage,
						status: needsMaintenance ? "maintenance-due" : vehicle.status,
					},
				)
				
				if (needsMaintenance) {
					return this.scheduleMaintenanceByMileage(vehicleId, newMileage)
				}
				
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		recordMaintenance: vi
			.fn()
			.mockImplementation((vehicleId, maintenanceType, description, cost, performedBy, mileageAtService) => {
				const vehicle = this.mapGet({ vehicle_id: vehicleId })
				const recordId = this.varGet()
				const currentTime = this.getBlockInfo(0).value
				
				if (vehicle) {
					const nextMaintenanceDate = currentTime + vehicle.maintenance_interval_days * 86400
					
					// Create maintenance record
					this.mapSet(
						{ record_id: recordId },
						{
							vehicle_id: vehicleId,
							date: currentTime,
							type: maintenanceType,
							description,
							cost,
							performed_by: performedBy,
							mileage_at_service: mileageAtService,
						},
					)
					
					// Update vehicle data
					this.mapSet(
						{ vehicle_id: vehicleId },
						{
							...vehicle,
							last_maintenance_date: currentTime,
							next_maintenance_date: nextMaintenanceDate,
							status: "active",
						},
					)
					
					this.varSet(recordId + 1)
					return { isOk: true, value: recordId }
				}
				return { isOk: false, error: 1 }
			}),
		
		scheduleMaintenance: vi.fn().mockImplementation((vehicleId, date, maintenanceType) => {
			const vehicle = this.mapGet({ vehicle_id: vehicleId })
			
			if (vehicle) {
				this.mapSet(
					{ vehicle_id: vehicleId, date },
					{
						maintenance_type: maintenanceType,
						scheduled: true,
						completed: false,
						maintenance_record_id: null,
					},
				)
				
				return { isOk: true, value: true }
			}
			return { isOk: false, error: 1 }
		}),
		
		scheduleMaintenanceByMileage: vi.fn().mockImplementation((vehicleId, currentMileage) => {
			const currentTime = this.getBlockInfo(0).value
			
			this.mapSet(
				{ vehicle_id: vehicleId, date: currentTime },
				{
					maintenance_type: "mileage-based",
					scheduled: true,
					completed: false,
					maintenance_record_id: null,
				},
			)
			
			return { isOk: true, value: true }
		}),
		
		getVehicle: vi.fn().mockImplementation((vehicleId) => {
			return this.mapGet({ vehicle_id: vehicleId })
		}),
		
		getMaintenanceRecord: vi.fn().mockImplementation((recordId) => {
			return this.mapGet({ record_id: recordId })
		}),
		
		getScheduledMaintenance: vi.fn().mockImplementation((vehicleId, date) => {
			return this.mapGet({ vehicle_id: vehicleId, date })
		}),
	}
}

