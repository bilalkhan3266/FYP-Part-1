# 🎯 Department Workflow - Mermaid Diagrams

## Complete System Flow Diagram

```mermaid
graph TD
    A["👤 Student Logs In<br/>JWT Authentication"] --> B["📋 Student Dashboard<br/>View Status & Submit"]
    
    B -->|Submit Clearance| C["📝 Form Submission<br/>Fill Student Details"]
    C -->|POST /api/clearance| D["🔐 Backend Validation<br/>Verify JWT Token"]
    
    D --> E{"Auto-Check<br/>All Departments"}
    
    E -->|Check Phase 1| F["🏢 PHASE 1: COORDINATION<br/>Check Registration Issues"]
    F -->|Issues Found?| G{Decision<br/>Coordination}
    G -->|No Issues| H["✓ Approved by Coordination"]
    G -->|Issues Found| I["✗ Rejected by Coordination<br/>Workflow Paused"]
    
    H --> J["📚 PHASE 2: LIBRARY<br/>Check Books & Fines"]
    J -->|Books OK?| K{Decision<br/>Library}
    K -->|No Issues| L["✓ Approved by Library"]
    K -->|Issues Found| M["✗ Rejected by Library<br/>Workflow Paused"]
    
    L --> N["🚗 PHASE 3: TRANSPORT<br/>Check Parking & Violations"]
    N -->|Permit OK?| O{Decision<br/>Transport}
    O -->|No Issues| P["✓ Approved by Transport"]
    O -->|Issues Found| Q["✗ Rejected by Transport<br/>Workflow Paused"]
    
    P --> R["💰 PHASE 4: FEE DEPARTMENT<br/>Check Tuition & Dues"]
    R -->|Fees Paid?| S{Decision<br/>Fee Dept}
    S -->|No Dues| T["✓ Approved by Fee Dept"]
    S -->|Dues Found| U["✗ Rejected by Fee Dept<br/>Workflow Paused"]
    
    T --> V["🎓 PHASE 5: STUDENT SERVICE<br/>Final Clearance Check"]
    V -->|Conduct OK?| W{Decision<br/>Student Service}
    W -->|All Clear| X["✓ Approved by Student Service"]
    W -->|Issues Found| Y["✗ Rejected by Student Service<br/>Workflow Paused"]
    
    X --> Z["✅ WORKFLOW COMPLETE<br/>All Phases Approved"]
    Z --> AA["📜 Generate Certificate<br/>With QR Code"]
    AA --> AB["📧 Send Email<br/>With PDF Attachment"]
    AB --> AC["📥 Student Downloads<br/>Certificate Ready"]
    
    I --> AD["⚠️ Resubmit Process<br/>Fix Issues & Retry"]
    M --> AD
    Q --> AD
    U --> AD
    Y --> AD
    AD -->|Resubmit| E
    
    style A fill:#e1f5ff
    style Z fill:#c8e6c9
    style AC fill:#fff9c4
    style I fill:#ffccbc
    style M fill:#ffccbc
    style Q fill:#ffccbc
    style U fill:#ffccbc
    style Y fill:#ffccbc
    style AD fill:#ffe0b2
```

---

## Department Dashboard Access Pattern

```mermaid
graph LR
    A["🔑 Department Staff<br/>Login with Role"] 
    
    A -->|role: coordination| B["🏢 COORDINATION<br/>Dashboard"]
    A -->|role: library| C["📚 LIBRARY<br/>Dashboard"]
    A -->|role: transport| D["🚗 TRANSPORT<br/>Dashboard"]
    A -->|role: feedepartment| E["💰 FEE<br/>Dashboard"]
    A -->|role: studentservice| F["🎓 STUDENT SERVICE<br/>Dashboard"]
    
    B --> B1["View Requests<br/>currentPhase = 0"]
    B1 --> B2["Decision:<br/>Approve/Reject"]
    B2 -->|Approve| B3["✓ Move to Phase 1"]
    B2 -->|Reject| B4["✗ Pause Workflow"]
    B3 --> B5["Library sees request"]
    
    C --> C1["View Requests<br/>currentPhase = 1"]
    C1 --> C2["Decision:<br/>Approve/Reject"]
    C2 -->|Approve| C3["✓ Move to Phase 2"]
    C2 -->|Reject| C4["✗ Pause Workflow"]
    C3 --> C5["Transport sees request"]
    
    D --> D1["View Requests<br/>currentPhase = 2"]
    D1 --> D2["Decision:<br/>Approve/Reject"]
    D2 -->|Approve| D3["✓ Move to Phase 3"]
    D2 -->|Reject| D4["✗ Pause Workflow"]
    D3 --> D5["Fee Dept sees request"]
    
    E --> E1["View Requests<br/>currentPhase = 3"]
    E1 --> E2["Decision:<br/>Approve/Reject"]
    E2 -->|Approve| E3["✓ Move to Phase 4"]
    E2 -->|Reject| E4["✗ Pause Workflow"]
    E3 --> E5["Student Service sees request"]
    
    F --> F1["View Requests<br/>currentPhase = 4"]
    F1 --> F2["Decision:<br/>Approve/Reject"]
    F2 -->|Approve| F3["✓ COMPLETE<br/>Generate Certificate"]
    F2 -->|Reject| F4["✗ Pause Workflow"]
    F3 --> F5["📧 Email Certificate"]
    
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e0f2f1
    style E fill:#fce4ec
    style F fill:#f1f8e9
    style B3 fill:#c8e6c9
    style C3 fill:#c8e6c9
    style D3 fill:#c8e6c9
    style E3 fill:#c8e6c9
    style F3 fill:#c8e6c9
    style B4 fill:#ffccbc
    style C4 fill:#ffccbc
    style D4 fill:#ffccbc
    style E4 fill:#ffccbc
    style F4 fill:#ffccbc
```

---

## Student Request Lifecycle - Detailed

```mermaid
stateDiagram-v2
    [*] --> SubmittingRequest: Click Submit
    
    SubmittingRequest --> ValidationCheck: Form Complete
    
    ValidationCheck --> AutoCheck{Auto-Check<br/>Department Issues}
    
    AutoCheck -->|All Clear| PhaseCoordination: Start Phase 1
    AutoCheck -->|Issues Found| ImmediateReject: Rejected
    
    ImmediateReject --> StudentNotified1: "Issues found,<br/>Please fix"
    StudentNotified1 --> ResubmitReady: Ready to Resubmit
    ResubmitReady --> ResubmitFlow: Click Resubmit
    ResubmitFlow --> AutoCheck
    
    PhaseCoordination --> CoordDecision{Coordination<br/>Reviews}
    CoordDecision -->|Reject| CoordReject: Rejected
    CoordDecision -->|Approve| PhaseLibrary: Move to Phase 2
    
    CoordReject --> StudentNotified2: Notify Student
    StudentNotified2 --> ResubmitReady
    
    PhaseLibrary --> LibDecision{Library<br/>Reviews}
    LibDecision -->|Reject| LibReject: Rejected
    LibDecision -->|Approve| PhaseTransport: Move to Phase 3
    
    LibReject --> StudentNotified3: Notify Student
    StudentNotified3 --> ResubmitReady
    
    PhaseTransport --> TransDecision{Transport<br/>Reviews}
    TransDecision -->|Reject| TransReject: Rejected
    TransDecision -->|Approve| PhaseFee: Move to Phase 4
    
    TransReject --> StudentNotified4: Notify Student
    StudentNotified4 --> ResubmitReady
    
    PhaseFee --> FeeDecision{Fee Dept<br/>Reviews}
    FeeDecision -->|Reject| FeeReject: Rejected
    FeeDecision -->|Approve| PhaseService: Move to Phase 5
    
    FeeReject --> StudentNotified5: Notify Student
    StudentNotified5 --> ResubmitReady
    
    PhaseService --> ServiceDecision{Student Service<br/>Reviews}
    ServiceDecision -->|Reject| ServiceReject: Rejected
    ServiceDecision -->|Approve| AllApproved: All Phases OK
    
    ServiceReject --> StudentNotified6: Notify Student
    StudentNotified6 --> ResubmitReady
    
    AllApproved --> GenerateCert: Generate Certificate
    GenerateCert --> GenerateQR: Create QR Code
    GenerateQR --> SendEmail: Send Email with PDF
    SendEmail --> AvailableDownload: Ready for Download
    
    AvailableDownload --> StudentDownloads: Student Downloads
    StudentDownloads --> Completed: ✅ COMPLETED
    
    Completed --> [*]
```

---

## Parallel Department View During Processing

```mermaid
graph TB
    subgraph Active["🔄 ACTIVE WORKFLOWS"]
        A1["Request ID: 12345<br/>Student: Ahmed<br/>Current Phase: Library"]
        A2["Request ID: 12346<br/>Student: Fatima<br/>Current Phase: Fee"]
        A3["Request ID: 12347<br/>Student: Ali<br/>Current Phase: Coordination"]
    end
    
    subgraph Pending["⏳ PENDING DECISIONS"]
        P1["Coordination Queue:<br/>5 pending requests"]
        P2["Library Queue:<br/>3 pending requests"]
        P3["Transport Queue:<br/>2 pending requests"]
        P4["Fee Queue:<br/>8 pending requests"]
        P5["Student Service Queue:<br/>1 pending request"]
    end
    
    subgraph Approved["✅ COMPLETED"]
        C1["Request ID: 12340<br/>Ahmed - Approved<br/>Certificate Ready"]
        C2["Request ID: 12341<br/>Sara - Approved<br/>Email Sent"]
        C3["Request ID: 12342<br/>Hassan - Approved<br/>Downloaded"]
    end
    
    subgraph Rejected["❌ REJECTED"]
        R1["Request ID: 12338<br/>Zara - Library<br/>Book not returned"]
        R2["Request ID: 12339<br/>Karim - Fee<br/>Outstanding dues"]
    end
    
    A1 --> P2
    A2 --> P4
    A3 --> P1
    
    C1 -.->|2 days| C2
    C2 -.->|3 days| C3
    
    R1 -.->|Student can resubmit|Pending
    R2 -.->|Student can resubmit|Pending
    
    style Active fill:#e3f2fd
    style Pending fill:#fff3e0
    style Approved fill:#c8e6c9
    style Rejected fill:#ffccbc
```

---

## Certificate Generation & Distribution Flow

```mermaid
graph TD
    A["🎓 All 5 Phases Approved"] --> B["Check Status = COMPLETED"]
    
    B --> C["🔍 Retrieve Student Data"]
    C --> C1["Name, SAP ID, Departments"]
    C --> C2["Approval dates & times"]
    C --> C3["Program & semester"]
    
    C1 & C2 & C3 --> D["📜 Generate Certificate"]
    D --> D1["Create PDF layout"]
    D --> D2["Add Riphah Logo"]
    D --> D3["Insert approval info"]
    
    D1 & D2 & D3 --> E["🔲 Generate QR Code"]
    E --> E1["Encode: Certificate ID"]
    E --> E2["Link: /verify/:id"]
    
    E1 & E2 --> F["📎 Save PDF File"]
    F --> F1["Location: /certificates/"]
    F --> F2["Name: Certificate_SAPID.pdf"]
    
    F1 & F2 --> G["📧 Send Email"]
    G --> G1["Recipient: Student Email"]
    G --> G2["Subject: Clearance Approved"]
    G --> G3["Attachment: PDF"]
    G --> G4["Body: Congratulations msg"]
    
    G1 & G2 & G3 & G4 --> H["💾 Create Message Record"]
    H --> H1["Type: notification"]
    H --> H2["Store in DB"]
    H --> H3["Show in Dashboard"]
    
    H1 & H2 & H3 --> I["📥 Student Options"]
    I --> I1["Download from dashboard"]
    I --> I2["Print to A4 paper"]
    I --> I3["Share via QR code"]
    I --> I4["Verify online: /verify/:id"]
    
    I1 & I2 & I3 & I4 --> J["✅ COMPLETE"]
    
    style A fill:#c8e6c9
    style D fill:#bbdefb
    style E fill:#c5cae9
    style G fill:#f8bbd0
    style J fill:#a1d99e
```

---

## Admin Dashboard Overview

```mermaid
graph TB
    Admin["🔧 Admin Dashboard"]
    
    Admin --> Stats["📊 Statistics"]
    Stats --> S1["Total workflows: 2,459"]
    Stats --> S2["Completed: 2,245 (91%)"]
    Stats --> S3["In Progress: 140"]
    Stats --> S4["Rejected: 74"]
    
    Admin --> DeptPerf["🏢 Department Performance"]
    DeptPerf --> D1["Coordination: 98% approval"]
    DeptPerf --> D2["Library: 85% approval"]
    DeptPerf --> D3["Transport: 95% approval"]
    DeptPerf --> D4["Fee: 78% approval"]
    DeptPerf --> D5["Student Service: 96% approval"]
    
    Admin --> Users["👥 User Management"]
    Users --> U1["Add/Edit staff"]
    Users --> U2["View activity logs"]
    Users --> U3["Reset passwords"]
    
    Admin --> Reports["📈 Reports"]
    Reports --> R1["Monthly trends"]
    Reports --> R2["Department comparison"]
    Reports --> R3["Student demographics"]
    Reports --> R4["Export to Excel"]
    
    Admin --> Override["⚙️ System Control"]
    Override --> O1["Manual approve/reject"]
    Override --> O2["Reset workflows"]
    Override --> O3["Generate certificates"]
    Override --> O4["Bulk messages"]
    
    style Admin fill:#f5f5f5
    style Stats fill:#e1f5fe
    style DeptPerf fill:#f3e5f5
    style Users fill:#ffe0b2
    style Reports fill:#c8e6c9
    style Override fill:#ffccbc
```

---

## Department Issue Checking Logic

```mermaid
graph TD
    A["📋 Student Submits"] --> B["Get Student SAP ID"]
    
    B --> C["Check Phase 1: Coordination"]
    C --> C1["Query: DepartmentIssue<br/>WHERE sapid=? AND dept=coordination"]
    C1 --> C2{Issues<br/>Found?}
    C2 -->|Yes| C3["✗ REJECT - Issues found"]
    C2 -->|No| C4["✓ APPROVE - No issues"]
    
    C3 --> D["Pause at Phase 1"]
    C4 --> E["Check Phase 2: Library"]
    
    E --> E1["Query: DepartmentIssue<br/>WHERE sapid=? AND dept=library"]
    E1 --> E2{Issues<br/>Found?}
    E2 -->|Yes| E3["✗ REJECT - Book/Fine"]
    E2 -->|No| E4["✓ APPROVE - Cleared"]
    
    E3 --> F["Pause at Phase 2"]
    E4 --> G["Check Phase 3: Transport"]
    
    G --> G1["Query: DepartmentIssue<br/>WHERE sapid=? AND dept=transport"]
    G1 --> G2{Issues<br/>Found?}
    G2 -->|Yes| G3["✗ REJECT - Violation"]
    G2 -->|No| G4["✓ APPROVE - Clear"]
    
    G3 --> H["Pause at Phase 3"]
    G4 --> I["Check Phase 4: Fee"]
    
    I --> I1["Query: DepartmentIssue<br/>WHERE sapid=? AND dept=fee"]
    I1 --> I2{Issues<br/>Found?}
    I2 -->|Yes| I3["✗ REJECT - Dues"]
    I2 -->|No| I4["✓ APPROVE - Paid"]
    
    I3 --> J["Pause at Phase 4"]
    I4 --> K["Check Phase 5: Service"]
    
    K --> K1["Query: DepartmentIssue<br/>WHERE sapid=? AND dept=service"]
    K1 --> K2{Issues<br/>Found?}
    K2 -->|Yes| K3["✗ REJECT - Conduct"]
    K2 -->|No| K4["✓ APPROVE - Clear"]
    
    K3 --> L["Pause at Phase 5"]
    K4 --> M["✅ ALL APPROVED"]
    
    M --> N["Generate Certificate"]
    N --> O["Send Email"]
    O --> P["Mark COMPLETED"]
    
    style M fill:#c8e6c9
    style C3 fill:#ffccbc
    style E3 fill:#ffccbc
    style G3 fill:#ffccbc
    style I3 fill:#ffccbc
    style K3 fill:#ffccbc
    style D fill:#ffe0b2
    style F fill:#ffe0b2
    style H fill:#ffe0b2
    style J fill:#ffe0b2
    style L fill:#ffe0b2
```

---

## Resubmission Workflow

```mermaid
graph TD
    A["❌ REJECTED at Phase X"] --> B["Student Receives Notification"]
    B --> B1["Message: 'Please fix [issue]'"]
    B --> B2["Deadline: MM/DD/YYYY"]
    
    B1 & B2 --> C["Student Takes Action"]
    C --> C1["Resolves issue in real world"]
    C --> C1a["Books returned to library"]
    C --> C1b["Fines paid to fee dept"]
    C --> C1c["Parking permit renewed"]
    
    C1 & C1a & C1b & C1c --> D["🔄 Ready to Resubmit"]
    
    D --> E["Click RESUBMIT Button"]
    E --> F["System Re-checks Phases"]
    
    F --> F1["Phase 1-X-1: Status check"]
    F1 --> F1a["Previous phase status<br/>= approved (no change)"]
    
    F1a --> F2["Phase X: Re-check issue"]
    F2 --> F2a["Query department_issue"]
    F2a --> F2b{Issue<br/>Resolved?}
    
    F2b -->|YES| F3["✓ Set to APPROVED"]
    F2b -->|NO| F4["✗ Rejected again"]
    
    F3 --> F5["Continue to Phase X+1"]
    F4 --> F6["Pause again<br/>with new message"]
    F6 --> D
    
    F5 --> G["Auto-check phases X+1 to End"]
    G --> G1["Library: Check → Approve"]
    G --> G2["Transport: Check → Approve"]
    G --> G3["Fee: Check → Approve"]
    G --> G4["Service: Check → Approve"]
    
    G1 & G2 & G3 & G4 --> H["All Phases Complete"]
    H --> I["✅ WORKFLOW COMPLETED"]
    
    I --> J["Generate Certificate"]
    J --> K["Send Email"]
    K --> L["🎓 SUCCESS"]
    
    style A fill:#ffccbc
    style D fill:#ffe0b2
    style F3 fill:#c8e6c9
    style I fill:#c8e6c9
    style L fill:#fff9c4
```

---

## Data Model Relationships

```mermaid
erDiagram
    USER ||--o{ ClearanceWorkflow : "student submits"
    USER ||--o{ Message : "receives"
    USER ||--o{ DepartmentIssue : "has"
    
    ClearanceWorkflow ||--o{ ComprehensiveClearanceValidation : "generates"
    ClearanceWorkflow ||--o{ Message : "creates"
    
    DepartmentIssue }o--|| Department : "belongs to"
    
    USER {
        string _id PK
        string email UK
        string sap_id UK
        string role "student|coordination|library|transport|feedepartment|studentservice|admin"
        string department
    }
    
    ClearanceWorkflow {
        string _id PK
        string studentId FK
        string sapid
        string studentName
        string overallStatus "In Progress|Completed|Rejected"
        int currentPhase "0-4"
        object[] phases "Array of 5 phases"
        date submittedAt
        date completedAt
    }
    
    DepartmentIssue {
        string _id PK
        string student_sapid FK
        string department "coordination|library|transport|fee|service"
        string status "pending|resolved"
        string issueType "book_not_returned|fine_outstanding|etc"
        string description
    }
    
    ComprehensiveClearanceValidation {
        string _id PK
        string sapid FK
        object[] departments "Array of 5 dept statuses"
        string overallStatus "Approved|Rejected|Not Processed"
        boolean certificateGenerated
        date completedAt
    }
    
    Message {
        string _id PK
        string conversationId
        string senderId FK
        string senderRole
        string recipientSapId FK
        string subject
        string message
        date timestamp
    }
    
    Department {
        string name "Coordination|Library|Transport|Fee|Service"
        int phaseOrder "0-4"
        string roleValue
    }
```

---

**All diagrams show the complete working of 7 departments in the system:**
- ✅ Student Department (Portal/Submission)
- ✅ System Admin (Control/Analytics)  
- ✅ Coordination (Phase 1/Gate 1)
- ✅ Library (Phase 2/Gate 2)
- ✅ Transport (Phase 3/Gate 3)
- ✅ Fee Department (Phase 4/Gate 4)
- ✅ Student Service (Phase 5/Gate 5)
