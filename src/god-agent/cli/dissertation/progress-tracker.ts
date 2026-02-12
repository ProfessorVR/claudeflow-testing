/**
 * Dissertation Progress Tracker
 *
 * Tracks dissertation-specific milestones and progress including:
 * - Milestone management (proposal, IRB, data collection, chapters, defense)
 * - Chapter tracking with word counts and status
 * - Progress calculations and reporting
 * - Timeline visualization
 *
 * All operations work offline with local persistence.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Dissertation milestone types
 */
export type MilestoneType =
  | 'proposal'
  | 'irb'
  | 'data_collection'
  | 'chapter'
  | 'revision'
  | 'defense'
  | 'final_submission'
  | 'custom';

/**
 * Milestone status values
 */
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

/**
 * Chapter status values
 */
export type ChapterStatus = 'not_started' | 'drafting' | 'review' | 'revision' | 'approved';

/**
 * A dissertation milestone
 */
export interface DissertationMilestone {
  /** Unique milestone identifier */
  id: string;
  /** Human-readable milestone name */
  name: string;
  /** Type of milestone */
  type: MilestoneType;
  /** Current status */
  status: MilestoneStatus;
  /** Target due date */
  dueDate?: Date;
  /** Actual completion date */
  completedDate?: Date;
  /** IDs of prerequisite milestones */
  dependencies: string[];
  /** Additional notes */
  notes: string;
  /** Paths to related files */
  attachments: string[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Chapter tracking information
 */
export interface ChapterInfo {
  /** Chapter number (1-indexed) */
  number: number;
  /** Chapter title */
  title: string;
  /** Current status */
  status: ChapterStatus;
  /** Current word count */
  wordCount: number;
  /** Target word count (optional) */
  targetWordCount?: number;
  /** Last modification timestamp */
  lastModified: Date;
  /** File path to chapter draft */
  filePath?: string;
  /** Sections within the chapter */
  sections?: string[];
}

/**
 * Complete dissertation progress state
 */
export interface DissertationProgress {
  /** Dissertation title */
  title: string;
  /** Student name */
  studentName: string;
  /** Degree program (e.g., "PhD in Computer Science") */
  program: string;
  /** Primary advisor name */
  advisorName: string;
  /** Committee member names */
  committeeMembers: string[];
  /** Start date of dissertation work */
  startDate: Date;
  /** Expected completion date */
  expectedCompletionDate?: Date;
  /** All milestones */
  milestones: DissertationMilestone[];
  /** Chapter tracking */
  chapters: ChapterInfo[];
  /** Total word count across all chapters */
  totalWordCount: number;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Session ID this progress is associated with */
  sessionId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Configuration for initializing a dissertation
 */
export interface DissertationConfig {
  title: string;
  studentName: string;
  program: string;
  advisorName: string;
  committeeMembers: string[];
  expectedChapters?: number;
  startDate?: Date;
  expectedCompletionDate?: Date;
}

// ============================================================================
// Default Milestones
// ============================================================================

/**
 * Default milestones for a typical US doctoral dissertation
 */
const DEFAULT_MILESTONES: Omit<DissertationMilestone, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Proposal Defense',
    type: 'proposal',
    status: 'not_started',
    dependencies: [],
    notes: 'Formal defense of dissertation proposal before committee',
    attachments: []
  },
  {
    name: 'IRB Approval',
    type: 'irb',
    status: 'not_started',
    dependencies: [],
    notes: 'Institutional Review Board approval for human subjects research (if applicable)',
    attachments: []
  },
  {
    name: 'Data Collection',
    type: 'data_collection',
    status: 'not_started',
    dependencies: [],
    notes: 'Primary data collection phase',
    attachments: []
  },
  {
    name: 'Chapter 1 Draft - Introduction',
    type: 'chapter',
    status: 'not_started',
    dependencies: [],
    notes: 'Introduction chapter including problem statement and research questions',
    attachments: []
  },
  {
    name: 'Chapter 2 Draft - Literature Review',
    type: 'chapter',
    status: 'not_started',
    dependencies: [],
    notes: 'Comprehensive literature review and theoretical framework',
    attachments: []
  },
  {
    name: 'Chapter 3 Draft - Methodology',
    type: 'chapter',
    status: 'not_started',
    dependencies: [],
    notes: 'Research methodology and design',
    attachments: []
  },
  {
    name: 'Chapter 4 Draft - Results',
    type: 'chapter',
    status: 'not_started',
    dependencies: [],
    notes: 'Research findings and results',
    attachments: []
  },
  {
    name: 'Chapter 5 Draft - Discussion/Conclusion',
    type: 'chapter',
    status: 'not_started',
    dependencies: [],
    notes: 'Discussion, implications, and conclusions',
    attachments: []
  },
  {
    name: 'Committee Review',
    type: 'revision',
    status: 'not_started',
    dependencies: [],
    notes: 'Full draft review by committee members',
    attachments: []
  },
  {
    name: 'Final Defense',
    type: 'defense',
    status: 'not_started',
    dependencies: [],
    notes: 'Oral defense of completed dissertation',
    attachments: []
  },
  {
    name: 'Final Submission',
    type: 'final_submission',
    status: 'not_started',
    dependencies: [],
    notes: 'Submit approved dissertation to graduate school',
    attachments: []
  }
];

// ============================================================================
// Progress Tracker Class
// ============================================================================

/**
 * Tracks dissertation progress including milestones, chapters, and deadlines.
 * All data persists to `.phd-sessions/{sessionId}/dissertation/` directory.
 */
export class DissertationProgressTracker {
  private progress: DissertationProgress;
  private storagePath: string;
  private initialized: boolean = false;

  /**
   * Create a new progress tracker
   * @param sessionId - Pipeline session ID for storage path
   * @param baseDir - Base directory for storage (defaults to cwd)
   */
  constructor(sessionId?: string, baseDir: string = process.cwd()) {
    const sessionDir = sessionId
      ? path.join(baseDir, '.phd-sessions', sessionId, 'dissertation')
      : path.join(baseDir, '.phd-sessions', 'default', 'dissertation');

    this.storagePath = path.join(sessionDir, 'progress.json');

    // Initialize with empty progress
    this.progress = this.createEmptyProgress();
    this.progress.sessionId = sessionId;
  }

  /**
   * Create an empty progress object
   */
  private createEmptyProgress(): DissertationProgress {
    const now = new Date();
    return {
      title: '',
      studentName: '',
      program: '',
      advisorName: '',
      committeeMembers: [],
      startDate: now,
      milestones: [],
      chapters: [],
      totalWordCount: 0,
      overallProgress: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Initialize a new dissertation with basic configuration
   * @param config - Dissertation configuration
   */
  initialize(config: DissertationConfig): void {
    const now = new Date();

    this.progress = {
      title: config.title,
      studentName: config.studentName,
      program: config.program,
      advisorName: config.advisorName,
      committeeMembers: [...config.committeeMembers],
      startDate: config.startDate || now,
      expectedCompletionDate: config.expectedCompletionDate,
      milestones: [],
      chapters: [],
      totalWordCount: 0,
      overallProgress: 0,
      sessionId: this.progress.sessionId,
      createdAt: now,
      updatedAt: now
    };

    // Add default milestones
    for (const milestone of DEFAULT_MILESTONES) {
      this.addMilestone(milestone);
    }

    // Initialize default chapters
    const chapterCount = config.expectedChapters || 5;
    const defaultTitles = [
      'Introduction',
      'Literature Review',
      'Methodology',
      'Results',
      'Discussion and Conclusion'
    ];

    for (let i = 0; i < chapterCount; i++) {
      this.progress.chapters.push({
        number: i + 1,
        title: defaultTitles[i] || `Chapter ${i + 1}`,
        status: 'not_started',
        wordCount: 0,
        lastModified: now
      });
    }

    this.initialized = true;
    this.progress.updatedAt = now;
  }

  // ============================================================================
  // Milestone Management
  // ============================================================================

  /**
   * Add a new milestone
   * @param milestone - Milestone data (without id)
   * @returns The generated milestone ID
   */
  addMilestone(milestone: Omit<DissertationMilestone, 'id' | 'createdAt' | 'updatedAt'>): string {
    const now = new Date();
    const id = uuidv4();

    const newMilestone: DissertationMilestone = {
      ...milestone,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.progress.milestones.push(newMilestone);
    this.progress.updatedAt = now;

    return id;
  }

  /**
   * Update a milestone's status
   * @param id - Milestone ID
   * @param status - New status
   */
  updateMilestoneStatus(id: string, status: MilestoneStatus): void {
    const milestone = this.progress.milestones.find(m => m.id === id);
    if (!milestone) {
      throw new Error(`Milestone not found: ${id}`);
    }

    milestone.status = status;
    milestone.updatedAt = new Date();
    this.progress.updatedAt = new Date();

    // Recalculate overall progress
    this.progress.overallProgress = this.calculateOverallProgress();
  }

  /**
   * Mark a milestone as completed
   * @param id - Milestone ID
   */
  completeMilestone(id: string): void {
    const milestone = this.progress.milestones.find(m => m.id === id);
    if (!milestone) {
      throw new Error(`Milestone not found: ${id}`);
    }

    milestone.status = 'completed';
    milestone.completedDate = new Date();
    milestone.updatedAt = new Date();
    this.progress.updatedAt = new Date();

    // Recalculate overall progress
    this.progress.overallProgress = this.calculateOverallProgress();
  }

  /**
   * Get a milestone by ID
   * @param id - Milestone ID
   */
  getMilestone(id: string): DissertationMilestone | undefined {
    return this.progress.milestones.find(m => m.id === id);
  }

  /**
   * Get milestones by type
   * @param type - Milestone type
   */
  getMilestonesByType(type: MilestoneType): DissertationMilestone[] {
    return this.progress.milestones.filter(m => m.type === type);
  }

  /**
   * Update milestone notes
   * @param id - Milestone ID
   * @param notes - New notes
   */
  updateMilestoneNotes(id: string, notes: string): void {
    const milestone = this.progress.milestones.find(m => m.id === id);
    if (!milestone) {
      throw new Error(`Milestone not found: ${id}`);
    }

    milestone.notes = notes;
    milestone.updatedAt = new Date();
    this.progress.updatedAt = new Date();
  }

  /**
   * Add an attachment to a milestone
   * @param id - Milestone ID
   * @param filePath - Path to the attachment
   */
  addMilestoneAttachment(id: string, filePath: string): void {
    const milestone = this.progress.milestones.find(m => m.id === id);
    if (!milestone) {
      throw new Error(`Milestone not found: ${id}`);
    }

    if (!milestone.attachments.includes(filePath)) {
      milestone.attachments.push(filePath);
      milestone.updatedAt = new Date();
      this.progress.updatedAt = new Date();
    }
  }

  // ============================================================================
  // Chapter Tracking
  // ============================================================================

  /**
   * Update chapter information
   * @param chapterNumber - Chapter number (1-indexed)
   * @param update - Partial chapter update
   */
  updateChapter(chapterNumber: number, update: Partial<ChapterInfo>): void {
    const chapter = this.progress.chapters.find(c => c.number === chapterNumber);

    if (!chapter) {
      // Create new chapter if it doesn't exist
      const now = new Date();
      this.progress.chapters.push({
        number: chapterNumber,
        title: update.title || `Chapter ${chapterNumber}`,
        status: update.status || 'not_started',
        wordCount: update.wordCount || 0,
        targetWordCount: update.targetWordCount,
        lastModified: now,
        filePath: update.filePath,
        sections: update.sections
      });
    } else {
      // Update existing chapter
      if (update.title !== undefined) chapter.title = update.title;
      if (update.status !== undefined) chapter.status = update.status;
      if (update.wordCount !== undefined) chapter.wordCount = update.wordCount;
      if (update.targetWordCount !== undefined) chapter.targetWordCount = update.targetWordCount;
      if (update.filePath !== undefined) chapter.filePath = update.filePath;
      if (update.sections !== undefined) chapter.sections = update.sections;
      chapter.lastModified = new Date();
    }

    // Recalculate totals
    this.progress.totalWordCount = this.progress.chapters.reduce(
      (sum, ch) => sum + ch.wordCount,
      0
    );
    this.progress.overallProgress = this.calculateOverallProgress();
    this.progress.updatedAt = new Date();
  }

  /**
   * Get chapter by number
   * @param chapterNumber - Chapter number (1-indexed)
   */
  getChapter(chapterNumber: number): ChapterInfo | undefined {
    return this.progress.chapters.find(c => c.number === chapterNumber);
  }

  /**
   * Add a new chapter
   * @param title - Chapter title
   * @param targetWordCount - Optional target word count
   */
  addChapter(title: string, targetWordCount?: number): void {
    const maxNumber = Math.max(0, ...this.progress.chapters.map(c => c.number));
    const now = new Date();

    this.progress.chapters.push({
      number: maxNumber + 1,
      title,
      status: 'not_started',
      wordCount: 0,
      targetWordCount,
      lastModified: now
    });

    this.progress.updatedAt = now;
  }

  // ============================================================================
  // Progress Calculations
  // ============================================================================

  /**
   * Calculate overall dissertation progress
   * Based on milestone completion and chapter status
   * @returns Progress percentage (0-100)
   */
  calculateOverallProgress(): number {
    const milestoneWeight = 0.4;
    const chapterWeight = 0.6;

    // Milestone progress
    const totalMilestones = this.progress.milestones.length;
    const completedMilestones = this.progress.milestones.filter(
      m => m.status === 'completed'
    ).length;
    const inProgressMilestones = this.progress.milestones.filter(
      m => m.status === 'in_progress'
    ).length;

    const milestoneProgress = totalMilestones > 0
      ? ((completedMilestones + inProgressMilestones * 0.5) / totalMilestones) * 100
      : 0;

    // Chapter progress based on status
    const chapterStatusWeight: Record<ChapterStatus, number> = {
      'not_started': 0,
      'drafting': 0.25,
      'review': 0.5,
      'revision': 0.75,
      'approved': 1.0
    };

    const totalChapters = this.progress.chapters.length;
    const chapterProgressSum = this.progress.chapters.reduce(
      (sum, ch) => sum + chapterStatusWeight[ch.status],
      0
    );

    const chapterProgress = totalChapters > 0
      ? (chapterProgressSum / totalChapters) * 100
      : 0;

    // Combined progress
    return Math.round(
      milestoneProgress * milestoneWeight +
      chapterProgress * chapterWeight
    );
  }

  /**
   * Get the next milestone that should be worked on
   * Based on dependencies and status
   */
  getNextMilestone(): DissertationMilestone | null {
    // Find milestones that are not completed and have all dependencies met
    const eligible = this.progress.milestones.filter(m => {
      if (m.status === 'completed') return false;

      // Check if all dependencies are completed
      const dependenciesMet = m.dependencies.every(depId => {
        const dep = this.progress.milestones.find(dm => dm.id === depId);
        return dep?.status === 'completed';
      });

      return dependenciesMet;
    });

    // Prioritize: in_progress > not_started, then by due date
    const sorted = eligible.sort((a, b) => {
      // In progress first
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    return sorted[0] || null;
  }

  /**
   * Get all blocked milestones
   * (dependencies not met)
   */
  getBlockedMilestones(): DissertationMilestone[] {
    return this.progress.milestones.filter(m => m.status === 'blocked');
  }

  /**
   * Get all overdue milestones
   * (past due date and not completed)
   */
  getOverdueMilestones(): DissertationMilestone[] {
    const now = new Date();
    return this.progress.milestones.filter(m => {
      if (m.status === 'completed') return false;
      if (!m.dueDate) return false;
      return new Date(m.dueDate) < now;
    });
  }

  // ============================================================================
  // Reporting
  // ============================================================================

  /**
   * Generate a comprehensive progress report
   */
  generateProgressReport(): string {
    const lines: string[] = [];
    const p = this.progress;

    lines.push('# Dissertation Progress Report');
    lines.push('');
    lines.push(`## ${p.title}`);
    lines.push('');
    lines.push('### Overview');
    lines.push(`- **Student**: ${p.studentName}`);
    lines.push(`- **Program**: ${p.program}`);
    lines.push(`- **Advisor**: ${p.advisorName}`);
    lines.push(`- **Committee**: ${p.committeeMembers.join(', ')}`);
    lines.push(`- **Start Date**: ${this.formatDate(p.startDate)}`);
    if (p.expectedCompletionDate) {
      lines.push(`- **Expected Completion**: ${this.formatDate(p.expectedCompletionDate)}`);
    }
    lines.push('');
    lines.push(`### Overall Progress: ${p.overallProgress}%`);
    lines.push(this.generateProgressBar(p.overallProgress));
    lines.push('');

    // Chapter Status
    lines.push('### Chapter Status');
    lines.push('');
    lines.push('| Chapter | Title | Status | Words |');
    lines.push('|---------|-------|--------|-------|');
    for (const chapter of p.chapters) {
      const statusEmoji = this.getStatusEmoji(chapter.status);
      lines.push(`| ${chapter.number} | ${chapter.title} | ${statusEmoji} ${chapter.status} | ${chapter.wordCount.toLocaleString()} |`);
    }
    lines.push('');
    lines.push(`**Total Word Count**: ${p.totalWordCount.toLocaleString()}`);
    lines.push('');

    // Milestone Status
    lines.push('### Milestone Status');
    lines.push('');

    const milestonesByStatus = this.groupMilestonesByStatus();

    if (milestonesByStatus.completed.length > 0) {
      lines.push('#### Completed');
      for (const m of milestonesByStatus.completed) {
        lines.push(`- [x] ${m.name}${m.completedDate ? ` (${this.formatDate(m.completedDate)})` : ''}`);
      }
      lines.push('');
    }

    if (milestonesByStatus.in_progress.length > 0) {
      lines.push('#### In Progress');
      for (const m of milestonesByStatus.in_progress) {
        const due = m.dueDate ? ` - Due: ${this.formatDate(m.dueDate)}` : '';
        lines.push(`- [ ] ${m.name}${due}`);
      }
      lines.push('');
    }

    if (milestonesByStatus.not_started.length > 0) {
      lines.push('#### Not Started');
      for (const m of milestonesByStatus.not_started) {
        const due = m.dueDate ? ` - Due: ${this.formatDate(m.dueDate)}` : '';
        lines.push(`- [ ] ${m.name}${due}`);
      }
      lines.push('');
    }

    if (milestonesByStatus.blocked.length > 0) {
      lines.push('#### Blocked');
      for (const m of milestonesByStatus.blocked) {
        lines.push(`- [!] ${m.name} - ${m.notes || 'No details'}`);
      }
      lines.push('');
    }

    // Overdue items
    const overdue = this.getOverdueMilestones();
    if (overdue.length > 0) {
      lines.push('### Overdue Items');
      lines.push('');
      for (const m of overdue) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(m.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        lines.push(`- **${m.name}** - ${daysOverdue} days overdue`);
      }
      lines.push('');
    }

    lines.push(`*Report generated: ${this.formatDate(new Date())}*`);

    return lines.join('\n');
  }

  /**
   * Generate an agenda for advisor meetings
   */
  generateAdvisorMeetingAgenda(): string {
    const lines: string[] = [];
    const p = this.progress;

    lines.push('# Advisor Meeting Agenda');
    lines.push('');
    lines.push(`**Date**: ${this.formatDate(new Date())}`);
    lines.push(`**Student**: ${p.studentName}`);
    lines.push(`**Advisor**: ${p.advisorName}`);
    lines.push('');

    // Progress summary
    lines.push('## 1. Progress Summary');
    lines.push(`- Overall Progress: ${p.overallProgress}%`);
    lines.push(`- Total Word Count: ${p.totalWordCount.toLocaleString()}`);
    lines.push('');

    // Recent accomplishments
    const recentlyCompleted = p.milestones
      .filter(m => m.status === 'completed' && m.completedDate)
      .sort((a, b) =>
        new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime()
      )
      .slice(0, 3);

    if (recentlyCompleted.length > 0) {
      lines.push('## 2. Recent Accomplishments');
      for (const m of recentlyCompleted) {
        lines.push(`- ${m.name} (${this.formatDate(m.completedDate!)})`);
      }
      lines.push('');
    }

    // Current focus
    const inProgress = p.milestones.filter(m => m.status === 'in_progress');
    if (inProgress.length > 0) {
      lines.push('## 3. Current Focus');
      for (const m of inProgress) {
        lines.push(`- ${m.name}`);
        if (m.notes) lines.push(`  - Notes: ${m.notes}`);
      }
      lines.push('');
    }

    // Upcoming milestones
    const upcoming = p.milestones
      .filter(m => m.status !== 'completed' && m.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);

    if (upcoming.length > 0) {
      lines.push('## 4. Upcoming Deadlines');
      for (const m of upcoming) {
        const daysUntil = Math.floor(
          (new Date(m.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        lines.push(`- ${m.name} - ${this.formatDate(m.dueDate!)} (${daysUntil} days)`);
      }
      lines.push('');
    }

    // Blockers
    const blocked = this.getBlockedMilestones();
    const overdue = this.getOverdueMilestones();

    if (blocked.length > 0 || overdue.length > 0) {
      lines.push('## 5. Issues to Discuss');
      for (const m of blocked) {
        lines.push(`- [BLOCKED] ${m.name}: ${m.notes || 'Needs discussion'}`);
      }
      for (const m of overdue) {
        lines.push(`- [OVERDUE] ${m.name}`);
      }
      lines.push('');
    }

    // Chapter-specific items
    const chaptersInReview = p.chapters.filter(c => c.status === 'review');
    if (chaptersInReview.length > 0) {
      lines.push('## 6. Chapters for Review');
      for (const c of chaptersInReview) {
        lines.push(`- Chapter ${c.number}: ${c.title} (${c.wordCount.toLocaleString()} words)`);
      }
      lines.push('');
    }

    lines.push('## 7. Questions/Discussion Points');
    lines.push('- ');
    lines.push('');

    lines.push('## 8. Next Steps');
    lines.push('- ');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate an ASCII timeline visualization
   */
  generateTimelineVisualization(): string {
    const lines: string[] = [];
    const p = this.progress;

    lines.push('# Dissertation Timeline');
    lines.push('');

    // Calculate date range
    const startDate = new Date(p.startDate);
    const endDate = p.expectedCompletionDate
      ? new Date(p.expectedCompletionDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const today = new Date();
    const todayPosition = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Timeline width in characters
    const timelineWidth = 60;
    const scale = timelineWidth / totalDays;

    lines.push(`Start: ${this.formatDate(startDate)}    End: ${this.formatDate(endDate)}`);
    lines.push('');

    // Draw timeline header
    const header = '|' + '-'.repeat(timelineWidth) + '|';
    lines.push(header);

    // Mark today on timeline
    const todayMarker = ' '.repeat(Math.min(Math.max(0, Math.floor(todayPosition * scale)), timelineWidth - 1)) + 'v TODAY';
    lines.push(todayMarker);

    // Draw milestones on timeline
    const milestonesWithDates = p.milestones.filter(m => m.dueDate);

    for (const m of milestonesWithDates) {
      const dueDate = new Date(m.dueDate!);
      const position = Math.ceil(
        (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const charPos = Math.min(Math.max(0, Math.floor(position * scale)), timelineWidth - 1);

      const statusChar = m.status === 'completed' ? 'X' : m.status === 'in_progress' ? 'O' : '.';
      const line = ' '.repeat(charPos) + statusChar + ` ${m.name} (${this.formatDateShort(dueDate)})`;
      lines.push(line);
    }

    lines.push('');
    lines.push('Legend: X=Completed  O=In Progress  .=Not Started');
    lines.push('');

    // Progress bar
    lines.push('Overall Progress:');
    lines.push(this.generateProgressBar(p.overallProgress));
    lines.push('');

    return lines.join('\n');
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Save progress to disk
   */
  async save(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });

    // Serialize with proper date handling
    const json = JSON.stringify(this.progress, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);

    await fs.writeFile(this.storagePath, json, 'utf-8');
  }

  /**
   * Load progress from disk
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storagePath, 'utf-8');
      const data = JSON.parse(content);

      // Convert date strings back to Date objects
      this.progress = {
        ...data,
        startDate: new Date(data.startDate),
        expectedCompletionDate: data.expectedCompletionDate
          ? new Date(data.expectedCompletionDate)
          : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        milestones: data.milestones.map((m: DissertationMilestone) => ({
          ...m,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          completedDate: m.completedDate ? new Date(m.completedDate) : undefined,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt)
        })),
        chapters: data.chapters.map((c: ChapterInfo) => ({
          ...c,
          lastModified: new Date(c.lastModified)
        }))
      };

      this.initialized = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, start fresh
        this.progress = this.createEmptyProgress();
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if progress data exists on disk
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.storagePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current progress data
   */
  getProgress(): DissertationProgress {
    return { ...this.progress };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  private generateProgressBar(percentage: number): string {
    const width = 40;
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    return `[${'='.repeat(filled)}${' '.repeat(empty)}] ${percentage}%`;
  }

  private getStatusEmoji(status: ChapterStatus | MilestoneStatus): string {
    const emojis: Record<string, string> = {
      'not_started': '[ ]',
      'drafting': '[~]',
      'in_progress': '[~]',
      'review': '[?]',
      'revision': '[>]',
      'approved': '[x]',
      'completed': '[x]',
      'blocked': '[!]'
    };
    return emojis[status] || '[ ]';
  }

  private groupMilestonesByStatus(): Record<MilestoneStatus, DissertationMilestone[]> {
    return {
      not_started: this.progress.milestones.filter(m => m.status === 'not_started'),
      in_progress: this.progress.milestones.filter(m => m.status === 'in_progress'),
      completed: this.progress.milestones.filter(m => m.status === 'completed'),
      blocked: this.progress.milestones.filter(m => m.status === 'blocked')
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default DissertationProgressTracker;
