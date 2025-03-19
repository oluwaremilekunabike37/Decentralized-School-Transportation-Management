;; Driver Verification Contract
;; Tracks qualifications and safety records of school bus drivers

;; Define data structures
(define-map drivers
  { driver-id: uint }
  {
    name: (string-ascii 50),
    license-number: (string-ascii 20),
    license-expiry: uint,
    qualifications: (list 10 (string-ascii 30)),
    active: bool,
    safety-score: uint,
    last-background-check: uint
  }
)

(define-map safety-incidents
  { incident-id: uint }
  {
    driver-id: uint,
    timestamp: uint,
    description: (string-ascii 200),
    severity: uint,
    resolved: bool
  }
)

;; Define data variables
(define-data-var next-driver-id uint u1)
(define-data-var next-incident-id uint u1)

;; Public functions
(define-public (register-driver
  (name (string-ascii 50))
  (license-number (string-ascii 20))
  (license-expiry uint)
  (qualifications (list 10 (string-ascii 30)))
  (background-check-date uint))
  (let ((driver-id (var-get next-driver-id)))
    (begin
      (map-set drivers { driver-id: driver-id } {
        name: name,
        license-number: license-number,
        license-expiry: license-expiry,
        qualifications: qualifications,
        active: true,
        safety-score: u100,
        last-background-check: background-check-date
      })
      (var-set next-driver-id (+ driver-id u1))
      (ok driver-id)
    )
  )
)

(define-public (update-driver-license (driver-id uint) (license-number (string-ascii 20)) (license-expiry uint))
  (let ((driver (map-get? drivers { driver-id: driver-id })))
    (if (is-some driver)
      (begin
        (map-set drivers
          { driver-id: driver-id }
          (merge (unwrap-panic driver) {
            license-number: license-number,
            license-expiry: license-expiry
          })
        )
        (ok true)
      )
      (err u1) ;; Driver not found
    )
  )
)

(define-public (update-background-check (driver-id uint) (check-date uint))
  (let ((driver (map-get? drivers { driver-id: driver-id })))
    (if (is-some driver)
      (begin
        (map-set drivers
          { driver-id: driver-id }
          (merge (unwrap-panic driver) { last-background-check: check-date })
        )
        (ok true)
      )
      (err u1) ;; Driver not found
    )
  )
)

(define-public (deactivate-driver (driver-id uint))
  (let ((driver (map-get? drivers { driver-id: driver-id })))
    (if (is-some driver)
      (begin
        (map-set drivers
          { driver-id: driver-id }
          (merge (unwrap-panic driver) { active: false })
        )
        (ok true)
      )
      (err u1) ;; Driver not found
    )
  )
)

(define-public (activate-driver (driver-id uint))
  (let ((driver (map-get? drivers { driver-id: driver-id })))
    (if (is-some driver)
      (begin
        (map-set drivers
          { driver-id: driver-id }
          (merge (unwrap-panic driver) { active: true })
        )
        (ok true)
      )
      (err u1) ;; Driver not found
    )
  )
)

(define-public (record-safety-incident
  (driver-id uint)
  (description (string-ascii 200))
  (severity uint)
  (timestamp uint))
  (let (
    (incident-id (var-get next-incident-id))
    (driver (map-get? drivers { driver-id: driver-id }))
  )
    (if (is-some driver)
      (begin
        (map-set safety-incidents
          { incident-id: incident-id }
          {
            driver-id: driver-id,
            timestamp: timestamp,
            description: description,
            severity: severity,
            resolved: false
          }
        )
        ;; Update safety score
        (map-set drivers
          { driver-id: driver-id }
          (merge (unwrap-panic driver) {
            safety-score: (calculate-new-safety-score
                            (get safety-score (unwrap-panic driver))
                            severity)
          })
        )
        (var-set next-incident-id (+ incident-id u1))
        (ok incident-id)
      )
      (err u1) ;; Driver not found
    )
  )
)

(define-public (resolve-safety-incident (incident-id uint))
  (let ((incident (map-get? safety-incidents { incident-id: incident-id })))
    (if (is-some incident)
      (begin
        (map-set safety-incidents
          { incident-id: incident-id }
          (merge (unwrap-panic incident) { resolved: true })
        )
        (ok true)
      )
      (err u1) ;; Incident not found
    )
  )
)

;; Read-only functions
(define-read-only (get-driver (driver-id uint))
  (map-get? drivers { driver-id: driver-id })
)

(define-read-only (get-safety-incident (incident-id uint))
  (map-get? safety-incidents { incident-id: incident-id })
)

(define-read-only (check-driver-eligibility (driver-id uint) (current-time uint))
  (let ((driver (map-get? drivers { driver-id: driver-id })))
    (if (is-some driver)
      (let (
        (driver-data (unwrap-panic driver))
        (license-valid (> (get license-expiry driver-data) current-time))
        (background-check-valid (< (- current-time (get last-background-check driver-data)) u31536000)) ;; 1 year in seconds
        (safety-score-acceptable (>= (get safety-score driver-data) u70))
        (is-active (get active driver-data))
      )
        (ok (and license-valid background-check-valid safety-score-acceptable is-active))
      )
      (err u1) ;; Driver not found
    )
  )
)

;; Private functions
(define-private (calculate-new-safety-score (current-score uint) (incident-severity uint))
  (let (
    (penalty (if (>= incident-severity u8) u30 (if (>= incident-severity u5) u15 u5)))
    (new-score (if (> current-score penalty) (- current-score penalty) u0))
  )
    new-score
  )
)

