import { Match3, Match3OnMatchData, Match3OnPopData } from './Match3';
import { Match3ScoringConfig } from './Match3Config';
import { Match3Type } from './Match3Utility';

/** Default scoring values */
const DEFAULT_SCORING: Required<Match3ScoringConfig> = {
  pointsPerPop: 1,
  pointsPerSpecialPop: 3,
  matchPieceMultiplier: 1,
  comboMultiplier: 1,
  avgPointsPerSecond: 8,
};

/** Default gameplay stats data */
const defaultStatsData = {
  score: 0,
  matches: 0,
  pops: 0,
  specials: 0,
  clearedPieces: 0,
  clearedByName: {} as Record<string, number>,
  grade: 0,
};

/** gameplay stats data */
export type Match3StatsData = typeof defaultStatsData;

/**
 * Computes scores and general gameplay stats during the session.
 */
export class Match3Stats {
  /** The Match3 instance */
  private match3: Match3;
  /** Current internal stats data */
  private data: Match3StatsData;

  constructor(match3: Match3) {
    this.match3 = match3;
    this.data = { ...defaultStatsData, clearedByName: {} };
  }

  /**
   * Reset all stats
   */
  public reset() {
    this.data = { ...defaultStatsData, clearedByName: {} };
  }

  /**
   * Update stats params based on given params
   * @param data The piece pop data
   */
  public registerPop(data: Match3OnPopData) {
    const sc = this.scoring();
    const points = data.causedBySpecial ? sc.pointsPerSpecialPop : sc.pointsPerPop;
    this.data.score += points;
    this.data.pops += 1;
    if (data.isSpecial) {
      this.data.specials += 1;
      // Special goals are counted at spawn time (registerSpawn), not at activation
    } else {
      this.data.clearedPieces += 1;
      const name = this.match3.board.typesMap[data.type];
      if (name) this.data.clearedByName[name] = (this.data.clearedByName[name] ?? 0) + 1;
    }
  }

  /**
   * Update stats params based on given match data
   * @param data The match data
   */
  /**
   * Track a special piece being spawned onto the board (counts toward special goals)
   * @param type The type of the special piece spawned
   */
  public registerSpawn(type: Match3Type) {
    const name = this.match3.board.typesMap[type];
    if (name) this.data.clearedByName[name] = (this.data.clearedByName[name] ?? 0) + 1;
  }

  public registerMatch(data: Match3OnMatchData) {
    const sc = this.scoring();
    for (const match of data.matches) {
      const points = match.length * sc.matchPieceMultiplier + data.matches.length * data.combo * sc.comboMultiplier;
      this.data.score += points;
      this.data.matches += 1;
    }
  }

  /**
   * Calculate a grade from 0 (worst) to 3 (best) based on given score and playtime
   * @param score The score to calculated
   * @param playTime The play time (in milliseconds) of the score
   * @returns An number (0 to 3) representing the grade
   */
  public caulculateGrade(score: number, playTime: number) {
    const avg = this.scoring().avgPointsPerSecond;
    const gameplayTimeInSecs = playTime / 1000;
    const pointsPerSecond = score / gameplayTimeInSecs;

    let grade = 0;
    if (pointsPerSecond > avg * 2) {
      grade = 3;
    } else if (pointsPerSecond > avg) {
      grade = 2;
    } else if (pointsPerSecond > avg * 0.1) {
      grade = 1;
    }

    return grade;
  }

  public getScore() {
    return this.data.score;
  }

  /** Returns the effective scoring config, merging defaults with any overrides in match3.config */
  private scoring(): Required<import('./Match3Config').Match3ScoringConfig> {
    return { ...DEFAULT_SCORING, ...this.match3.config.scoring };
  }

  public getClearedPieces() {
    return this.data.clearedPieces;
  }

  public getClearedByName(): Record<string, number> {
    return this.data.clearedByName;
  }

  /**
   * Retrieve full gameplay session performance in an object
   */
  public getGameplayPerformance() {
    const grade = this.caulculateGrade(this.data.score, this.match3.timer.getTime());
    return { ...this.data, grade };
  }
}
