export interface AiAction {
  label: string
  action: string
}

export interface InboxMessage {
  id: string
  subject: string
  from: string
  fromDomain: string
  preview: string
  receivedAt: string
  isRead: boolean
  aiSummary?: string
  aiActions?: AiAction[]
}

export interface MockUser {
  id: string
  email: string
  displayName: string
  biometricHash: string
}

export const mockUser: MockUser = {
  id: 'usr_9f3a2b1c',
  email: 'alex.chen@quantmail.io',
  displayName: 'Alex Chen',
  biometricHash: 'bf4a2c91e3d7f605a8b2e1c4d9f3a7b0c2e5d8f1a4b7c0e3f6a9b2c5d8e1f4',
}

export const mockInboxMessages: InboxMessage[] = [
  {
    id: 'msg_001',
    subject: 'Q3 Partnership Agreement — Final Review',
    from: 'sarah.kim@nexus-ventures.com',
    fromDomain: 'nexus-ventures.com',
    preview:
      'Hi Alex, the legal team has signed off on all clauses. We are ready to proceed with the final signature round pending your confirmation on the equity split...',
    receivedAt: '2024-07-15T09:30:00Z',
    isRead: false,
    aiSummary:
      'Legal team approved. Equity split confirmation needed. Estimated value: $2.4M deal. Deadline: EOD Friday.',
    aiActions: [
      { label: 'Accept & Sync to Calendar', action: 'ACCEPT_CALENDAR' },
      { label: 'Request Extension', action: 'REQUEST_EXTENSION' },
    ],
  },
  {
    id: 'msg_002',
    subject: 'Neural Interface SDK — v2.4.0 Release Notes',
    from: 'devrel@synaptic-labs.io',
    fromDomain: 'synaptic-labs.io',
    preview:
      'The v2.4.0 SDK ships with latency improvements of up to 38% on biometric handshake flows. Breaking change: `LivenessGrid.init()` now requires async/await...',
    receivedAt: '2024-07-15T08:15:00Z',
    isRead: true,
    aiSummary:
      '38% latency improvement. Breaking change in LivenessGrid API. Upgrade path is non-trivial — schedule 2hrs for migration.',
    aiActions: [
      { label: 'Schedule Migration Sprint', action: 'SCHEDULE_SPRINT' },
      { label: 'Archive SDK Docs', action: 'ARCHIVE_DOCS' },
    ],
  },
  {
    id: 'msg_003',
    subject: 'Board Meeting — Agenda Finalization',
    from: 'cfo@infinitytrinity.co',
    fromDomain: 'infinitytrinity.co',
    preview:
      'Attaching the revised agenda. Key items: Series B bridge terms, biometric patent licensing, and the APAC market entry timeline. Please confirm attendance...',
    receivedAt: '2024-07-14T17:45:00Z',
    isRead: false,
    aiSummary:
      'Series B bridge discussion + patent licensing on agenda. APAC expansion decision imminent. Attendance confirmation required.',
    aiActions: [
      { label: 'Confirm Attendance', action: 'CONFIRM_ATTENDANCE' },
      { label: 'Add to Calendar', action: 'ADD_CALENDAR' },
    ],
  },
  {
    id: 'msg_004',
    subject: 'Cryptographic Audit Report — Liveness Grid Hash v3',
    from: 'auditor@zerotrust-security.net',
    fromDomain: 'zerotrust-security.net',
    preview:
      'Our penetration testing team completed the 72-hour audit of the Liveness Grid hashing system. Zero critical vulnerabilities found. One medium-severity finding...',
    receivedAt: '2024-07-14T14:20:00Z',
    isRead: true,
    aiSummary:
      'Audit passed. Zero critical issues. One medium-severity finding on salt rotation interval — recommend patching within 30 days.',
    aiActions: [
      { label: 'Schedule Patch Window', action: 'SCHEDULE_PATCH' },
      { label: 'Download Full Report', action: 'DOWNLOAD_REPORT' },
    ],
  },
  {
    id: 'msg_005',
    subject: 'Investor Update — July 2024',
    from: 'ir@quantmail.io',
    fromDomain: 'quantmail.io',
    preview:
      'Monthly investor digest: MAU up 34% MoM, biometric verification success rate at 99.2%, shadow inbox catching 847 spam attempts daily. Full metrics attached...',
    receivedAt: '2024-07-13T10:00:00Z',
    isRead: true,
    aiSummary:
      'Strong growth metrics. MAU +34%, spam block rate excellent. Attach to board deck for next meeting.',
    aiActions: [
      { label: 'Add to Board Deck', action: 'ADD_BOARD_DECK' },
      { label: 'Share with Advisors', action: 'SHARE_ADVISORS' },
    ],
  },
]

export const mockShadowMessages: InboxMessage[] = [
  {
    id: 'shadow_001',
    subject: 'You won a FREE iPhone 15 Pro!!! CLAIM NOW',
    from: 'prizes.winner2024@gmail.com',
    fromDomain: 'gmail.com',
    preview:
      'Congratulations! You have been selected as our lucky winner. Click here to claim your prize before it expires in 24 hours...',
    receivedAt: '2024-07-15T11:00:00Z',
    isRead: false,
  },
  {
    id: 'shadow_002',
    subject: 'Urgent: Your account will be suspended',
    from: 'security-alert@yahoo.com',
    fromDomain: 'yahoo.com',
    preview:
      'We detected suspicious activity on your account. Verify your identity immediately or your account will be permanently suspended within 48 hours...',
    receivedAt: '2024-07-15T09:45:00Z',
    isRead: false,
  },
  {
    id: 'shadow_003',
    subject: 'Make $5000/week working from home',
    from: 'opportunities.real@gmail.com',
    fromDomain: 'gmail.com',
    preview:
      'Hi there! I found this incredible opportunity that changed my life. No experience needed. Work only 2 hours per day from anywhere in the world...',
    receivedAt: '2024-07-14T22:30:00Z',
    isRead: false,
  },
]
