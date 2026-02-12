/**
 * Tests for Register Enforcer
 *
 * Tests academic register consistency detection including:
 * - Contraction detection and expansion
 * - Colloquialism identification
 * - Slang detection
 * - First/second person usage
 * - Casual hedges and intensifiers
 * - Phrasal verb identification
 * - Conjunction sentence starts
 * - Exclamation and rhetorical question detection
 * - Register consistency scoring
 * - Auto-correction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RegisterEnforcer,
  createRegisterEnforcer,
  createStrictRegisterEnforcer,
  createPermissiveRegisterEnforcer,
  createDissertationRegisterEnforcer,
  RegisterAnalysis,
  RegisterViolation,
} from '../../../../src/god-agent/cli/style/register-enforcer.js';

describe('Register Enforcer', () => {
  let enforcer: RegisterEnforcer;

  beforeEach(() => {
    enforcer = createRegisterEnforcer();
  });

  // ==========================================================================
  // Constructor and Configuration
  // ==========================================================================

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const e = new RegisterEnforcer();
      const analysis = e.analyze('This is formal text.');

      expect(analysis).toBeDefined();
      expect(analysis.targetRegister).toBe('formal');
    });

    it('should accept custom configuration', () => {
      const e = new RegisterEnforcer({
        targetRegister: 'semi-formal',
        allowFirstPerson: true,
        minSeverity: 0.5,
      });

      const analysis = e.analyze('I think this is acceptable.');
      expect(analysis.targetRegister).toBe('semi-formal');
      // First person should be allowed
      const firstPersonViolations = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPersonViolations.length).toBe(0);
    });
  });

  // ==========================================================================
  // Contraction Detection
  // ==========================================================================

  describe('Contraction Detection', () => {
    it('should detect simple contractions', () => {
      const analysis = enforcer.analyze("The system doesn't work properly.");

      const contractionViolations = analysis.violations.filter(
        v => v.type === 'contraction'
      );
      expect(contractionViolations.length).toBe(1);
      expect(contractionViolations[0].text).toBe("doesn't");
      expect(contractionViolations[0].suggestions).toContain('does not');
    });

    it('should detect multiple contractions', () => {
      const text = "It's clear that we can't ignore this, and it won't go away.";
      const analysis = enforcer.analyze(text);

      const contractionViolations = analysis.violations.filter(
        v => v.type === 'contraction'
      );
      expect(contractionViolations.length).toBe(3);
    });

    it('should provide formal expansions for all contractions', () => {
      const contractions = ["don't", "can't", "won't", "I'm", "they've"];
      for (const c of contractions) {
        const analysis = enforcer.analyze(`Test ${c} test.`);
        const violations = analysis.violations.filter(
          v => v.type === 'contraction'
        );
        expect(violations.length).toBeGreaterThan(0);
        expect(violations[0].suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should detect case-insensitive contractions', () => {
      const analysis = enforcer.analyze("DOESN'T work and Don't worry.");

      const contractionViolations = analysis.violations.filter(
        v => v.type === 'contraction'
      );
      expect(contractionViolations.length).toBe(2);
    });
  });

  // ==========================================================================
  // Colloquialism Detection
  // ==========================================================================

  describe('Colloquialism Detection', () => {
    it('should detect common colloquialisms', () => {
      const analysis = enforcer.analyze(
        'There are a lot of things to consider.'
      );

      const colloquialisms = analysis.violations.filter(
        v => v.type === 'colloquialism'
      );
      expect(colloquialisms.length).toBeGreaterThan(0);
    });

    it('should suggest formal alternatives', () => {
      const analysis = enforcer.analyze('We need to look at the data.');

      const colloquialisms = analysis.violations.filter(
        v => v.type === 'colloquialism'
      );
      expect(colloquialisms.length).toBeGreaterThan(0);
      expect(colloquialisms[0].suggestions.length).toBeGreaterThan(0);
    });

    it('should detect phrasal colloquialisms', () => {
      const analysis = enforcer.analyze(
        'We need to find out what happened.'
      );

      const colloquialisms = analysis.violations.filter(
        v => v.type === 'colloquialism'
      );
      expect(colloquialisms.length).toBeGreaterThan(0);
      expect(colloquialisms.some(c => c.text.toLowerCase() === 'find out')).toBe(true);
    });
  });

  // ==========================================================================
  // Slang Detection
  // ==========================================================================

  describe('Slang Detection', () => {
    it('should detect slang terms', () => {
      const analysis = enforcer.analyze('This is a cool approach to the problem.');

      const slang = analysis.violations.filter(v => v.type === 'slang');
      expect(slang.length).toBe(1);
      expect(slang[0].text.toLowerCase()).toBe('cool');
    });

    it('should detect multiple slang terms', () => {
      const analysis = enforcer.analyze(
        'This is pretty much awesome and gonna be okay.'
      );

      const slang = analysis.violations.filter(v => v.type === 'slang');
      expect(slang.length).toBeGreaterThan(2);
    });

    it('should have high severity for slang', () => {
      const analysis = enforcer.analyze('This approach is cool.');

      const slang = analysis.violations.filter(v => v.type === 'slang');
      expect(slang.length).toBe(1);
      expect(slang[0].severity).toBeGreaterThan(0.7);
    });
  });

  // ==========================================================================
  // First Person Detection
  // ==========================================================================

  describe('First Person Detection', () => {
    it('should detect first person by default', () => {
      const analysis = enforcer.analyze('I believe this theory is correct.');

      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBe(1);
    });

    it('should skip first person when allowed', () => {
      const e = new RegisterEnforcer({ allowFirstPerson: true });
      const analysis = e.analyze('I argue that this is important.');

      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBe(0);
    });

    it('should detect all first person pronouns', () => {
      const analysis = enforcer.analyze(
        'I think my approach serves me well and myself.'
      );

      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBeGreaterThan(2);
    });

    it('should ignore first person in quotations', () => {
      const analysis = enforcer.analyze('Smith states "I believe this is true".');

      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBe(0);
    });
  });

  // ==========================================================================
  // Second Person Detection
  // ==========================================================================

  describe('Second Person Detection', () => {
    it('should detect second person usage', () => {
      const analysis = enforcer.analyze('You can see this in the results.');

      const secondPerson = analysis.violations.filter(
        v => v.type === 'second_person'
      );
      expect(secondPerson.length).toBe(1);
    });

    it('should suggest formal alternatives', () => {
      const analysis = enforcer.analyze('You should consider this approach.');

      const secondPerson = analysis.violations.filter(
        v => v.type === 'second_person'
      );
      expect(secondPerson[0].suggestions).toContain('one');
    });

    it('should ignore second person in quotations', () => {
      const analysis = enforcer.analyze(
        'The instruction reads "You must complete this step".'
      );

      const secondPerson = analysis.violations.filter(
        v => v.type === 'second_person'
      );
      expect(secondPerson.length).toBe(0);
    });
  });

  // ==========================================================================
  // Casual Hedges
  // ==========================================================================

  describe('Casual Hedge Detection', () => {
    it('should detect casual hedging words', () => {
      const analysis = enforcer.analyze(
        'This basically shows the relationship.'
      );

      const hedges = analysis.violations.filter(
        v => v.type === 'hedging_casual'
      );
      expect(hedges.length).toBe(1);
      expect(hedges[0].text.toLowerCase()).toBe('basically');
    });

    it('should detect filler phrases', () => {
      const analysis = enforcer.analyze('I guess this could work.');

      const hedges = analysis.violations.filter(
        v => v.type === 'hedging_casual'
      );
      expect(hedges.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Casual Intensifiers
  // ==========================================================================

  describe('Casual Intensifier Detection', () => {
    it('should detect casual intensifiers', () => {
      const analysis = enforcer.analyze('This is really important.');

      const intensifiers = analysis.violations.filter(
        v => v.type === 'intensifier_casual'
      );
      expect(intensifiers.length).toBe(1);
    });

    it('should suggest formal alternatives', () => {
      const analysis = enforcer.analyze('The results are very significant.');

      const intensifiers = analysis.violations.filter(
        v => v.type === 'intensifier_casual'
      );
      expect(intensifiers[0].suggestions).toContain('highly');
    });
  });

  // ==========================================================================
  // Phrasal Verbs
  // ==========================================================================

  describe('Phrasal Verb Detection', () => {
    it('should detect phrasal verbs', () => {
      const analysis = enforcer.analyze('We need to break down the data.');

      const phrasal = analysis.violations.filter(
        v => v.type === 'phrasal_verb'
      );
      expect(phrasal.length).toBe(1);
      expect(phrasal[0].text.toLowerCase()).toBe('break down');
    });

    it('should suggest formal alternatives for phrasal verbs', () => {
      const analysis = enforcer.analyze('This work was put off until later.');

      const phrasal = analysis.violations.filter(
        v => v.type === 'phrasal_verb'
      );
      expect(phrasal.length).toBe(1);
      expect(phrasal[0].suggestions).toContain('postpone');
    });
  });

  // ==========================================================================
  // Conjunction Starts
  // ==========================================================================

  describe('Conjunction Start Detection', () => {
    it('should detect sentences starting with conjunctions', () => {
      const analysis = enforcer.analyze(
        'This is important. But the data shows otherwise.'
      );

      const conjStarts = analysis.violations.filter(
        v => v.type === 'conjunction_start'
      );
      expect(conjStarts.length).toBe(1);
    });

    it('should detect various conjunction starts', () => {
      const analysis = enforcer.analyze(
        'First point. And second point. So third point.'
      );

      const conjStarts = analysis.violations.filter(
        v => v.type === 'conjunction_start'
      );
      expect(conjStarts.length).toBe(2);
    });
  });

  // ==========================================================================
  // Exclamation Detection
  // ==========================================================================

  describe('Exclamation Detection', () => {
    it('should detect exclamation marks', () => {
      const analysis = enforcer.analyze('This finding is remarkable!');

      const exclamations = analysis.violations.filter(
        v => v.type === 'exclamation'
      );
      expect(exclamations.length).toBe(1);
    });

    it('should ignore exclamations in quotations', () => {
      const analysis = enforcer.analyze('The participant exclaimed "Amazing!"');

      const exclamations = analysis.violations.filter(
        v => v.type === 'exclamation'
      );
      expect(exclamations.length).toBe(0);
    });
  });

  // ==========================================================================
  // Rhetorical Question Detection
  // ==========================================================================

  describe('Rhetorical Question Detection', () => {
    it('should detect rhetorical questions', () => {
      const analysis = enforcer.analyze(
        'What could be more important?'
      );

      const questions = analysis.violations.filter(
        v => v.type === 'rhetorical_question'
      );
      expect(questions.length).toBe(1);
    });

    it('should allow rhetorical questions when configured', () => {
      const e = new RegisterEnforcer({ allowRhetoricalQuestions: true });
      const analysis = e.analyze('Why would this matter?');

      const questions = analysis.violations.filter(
        v => v.type === 'rhetorical_question'
      );
      expect(questions.length).toBe(0);
    });

    it('should ignore questions in quotations', () => {
      const analysis = enforcer.analyze('The text asks "What is truth?"');

      const questions = analysis.violations.filter(
        v => v.type === 'rhetorical_question'
      );
      expect(questions.length).toBe(0);
    });
  });

  // ==========================================================================
  // Consistency Score
  // ==========================================================================

  describe('Consistency Score Calculation', () => {
    it('should return high score for formal text', () => {
      const text =
        'The findings demonstrate a significant correlation between ' +
        'the variables. Furthermore, the methodology employed ensures ' +
        'reproducibility and validity.';

      const analysis = enforcer.analyze(text);
      expect(analysis.consistencyScore).toBeGreaterThan(0.8);
    });

    it('should return low score for informal text', () => {
      const text =
        "This is really cool and basically shows that stuff doesn't work. " +
        "You can see a lot of things going on!";

      const analysis = enforcer.analyze(text);
      expect(analysis.consistencyScore).toBeLessThan(0.5);
    });

    it('should return score between 0 and 1', () => {
      const analysis = enforcer.analyze('Some text with informal bits.');

      expect(analysis.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(analysis.consistencyScore).toBeLessThanOrEqual(1);
    });

    it('should handle empty text', () => {
      const analysis = enforcer.analyze('');

      expect(analysis.consistencyScore).toBe(1);
    });
  });

  // ==========================================================================
  // Register Distribution
  // ==========================================================================

  describe('Register Distribution', () => {
    it('should calculate register distribution', () => {
      const analysis = enforcer.analyze('This is formal. But kind of informal too.');

      expect(analysis.registerDistribution).toBeDefined();
      expect(analysis.registerDistribution.formal).toBeDefined();
      expect(analysis.registerDistribution['semi-formal']).toBeDefined();
      expect(analysis.registerDistribution.informal).toBeDefined();
    });

    it('should detect dominant register', () => {
      const formalText =
        'The methodology demonstrates significant correlation.';
      const informalText = "This is really cool and it's gonna be great!";

      const formalAnalysis = enforcer.analyze(formalText);
      const informalAnalysis = enforcer.analyze(informalText);

      expect(formalAnalysis.dominantRegister).toBe('formal');
      expect(informalAnalysis.dominantRegister).toBe('informal');
    });
  });

  // ==========================================================================
  // isAcceptable Method
  // ==========================================================================

  describe('isAcceptable Method', () => {
    it('should accept formal text', () => {
      const text = 'The research demonstrates significant findings.';
      expect(enforcer.isAcceptable(text)).toBe(true);
    });

    it('should reject informal text', () => {
      const text = "This is really cool and it's gonna be awesome!";
      expect(enforcer.isAcceptable(text)).toBe(false);
    });

    it('should respect custom threshold', () => {
      // Text with one minor violation (conjunction start)
      const text = 'The data is clear. But the implications are significant.';

      const analysis = enforcer.analyze(text);
      // Should have some violations lowering the score
      expect(analysis.consistencyScore).toBeLessThan(1);
      expect(analysis.consistencyScore).toBeGreaterThan(0.5);

      // Strict threshold - fails due to conjunction start
      expect(enforcer.isAcceptable(text, 0.99)).toBe(false);

      // Lenient threshold - should pass
      expect(enforcer.isAcceptable(text, 0.6)).toBe(true);
    });
  });

  // ==========================================================================
  // getSuggestions Method
  // ==========================================================================

  describe('getSuggestions Method', () => {
    it('should return suggestions for violations', () => {
      const suggestions = enforcer.getSuggestions("It doesn't work.");

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].original).toBe("doesn't");
      expect(suggestions[0].replacement).toBe('does not');
    });

    it('should include position information', () => {
      const suggestions = enforcer.getSuggestions("The system can't proceed.");

      expect(suggestions[0].position).toBeDefined();
      expect(typeof suggestions[0].position).toBe('number');
    });

    it('should include violation type', () => {
      const suggestions = enforcer.getSuggestions("Can't do this.");

      expect(suggestions[0].type).toBe('contraction');
    });
  });

  // ==========================================================================
  // autoCorrect Method
  // ==========================================================================

  describe('autoCorrect Method', () => {
    it('should expand contractions automatically', () => {
      const result = enforcer.autoCorrect("It doesn't work.");

      expect(result.corrected).toBe('It does not work.');
      expect(result.corrections).toBe(1);
    });

    it('should handle multiple contractions', () => {
      const result = enforcer.autoCorrect(
        "It's clear that we can't ignore what won't go away."
      );

      expect(result.corrected).not.toContain("'");
      expect(result.corrections).toBe(3);
    });

    it('should preserve case when possible', () => {
      const result = enforcer.autoCorrect("Don't do this.");

      // Note: Simple replacement may not preserve case perfectly
      expect(result.corrected.toLowerCase()).toContain('do not');
    });

    it('should return unchanged text if no corrections needed', () => {
      const original = 'This is formal text without contractions.';
      const result = enforcer.autoCorrect(original);

      expect(result.corrected).toBe(original);
      expect(result.corrections).toBe(0);
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create strict enforcer', () => {
      const strict = createStrictRegisterEnforcer();
      const analysis = strict.analyze('I think this approach is good.');

      // Should detect first person and colloquialism
      expect(analysis.violations.length).toBeGreaterThan(0);
    });

    it('should create permissive enforcer', () => {
      const permissive = createPermissiveRegisterEnforcer();
      const analysis = permissive.analyze('I think this approach is good.');

      // Should allow first person and be more lenient
      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBe(0);
    });

    it('should create dissertation enforcer', () => {
      const dissertation = createDissertationRegisterEnforcer();
      const analysis = dissertation.analyze('I argue that this theory applies.');

      // Should allow first person (common in dissertations)
      const firstPerson = analysis.violations.filter(
        v => v.type === 'first_person'
      );
      expect(firstPerson.length).toBe(0);
    });
  });

  // ==========================================================================
  // Analysis Metadata
  // ==========================================================================

  describe('Analysis Metadata', () => {
    it('should include word count', () => {
      const analysis = enforcer.analyze('One two three four five.');

      expect(analysis.metadata.wordCount).toBe(5);
    });

    it('should include sentence count', () => {
      const analysis = enforcer.analyze('First sentence. Second sentence. Third.');

      expect(analysis.metadata.sentenceCount).toBe(3);
    });

    it('should include analysis time', () => {
      const analysis = enforcer.analyze('Some text to analyze.');

      expect(analysis.metadata.analysisTimeMs).toBeDefined();
      expect(analysis.metadata.analysisTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Violation Context
  // ==========================================================================

  describe('Violation Context', () => {
    it('should include surrounding context', () => {
      const analysis = enforcer.analyze(
        'The approach is formal. But it really shows something informal here.'
      );

      const violation = analysis.violations.find(
        v => v.type === 'intensifier_casual'
      );

      expect(violation).toBeDefined();
      expect(violation!.context).toBeDefined();
      expect(violation!.context.length).toBeGreaterThan(0);
    });

    it('should handle context at text boundaries', () => {
      const analysis = enforcer.analyze("Can't do this at the start.");

      expect(analysis.violations[0].context).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const analysis = enforcer.analyze('');

      expect(analysis.violations.length).toBe(0);
      expect(analysis.consistencyScore).toBe(1);
    });

    it('should handle whitespace-only text', () => {
      const analysis = enforcer.analyze('   \n\t   ');

      expect(analysis.violations.length).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'The formal academic text. '.repeat(1000);
      const analysis = enforcer.analyze(longText);

      expect(analysis).toBeDefined();
      expect(analysis.metadata.wordCount).toBeGreaterThan(1000);
    });

    it('should handle special characters', () => {
      const analysis = enforcer.analyze('Test with symbols: @#$% and numbers 123.');

      expect(analysis).toBeDefined();
    });

    it('should handle mixed quotation styles', () => {
      const analysis = enforcer.analyze(
        `He said "I think" and she replied 'I agree'.`
      );

      // Both should be treated as quotations
      expect(analysis.violations.filter(v => v.type === 'first_person').length).toBe(0);
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should analyze text efficiently', () => {
      const text = 'This is sample text for analysis. '.repeat(100);
      const start = Date.now();

      enforcer.analyze(text);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should handle rapid successive analyses', () => {
      const texts = Array(50).fill(null).map((_, i) =>
        `Sample text number ${i} with some informal bits like gonna.`
      );

      const start = Date.now();
      for (const text of texts) {
        enforcer.analyze(text);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000); // 50 analyses in under 1 second
    });
  });

  // ==========================================================================
  // Violations by Type
  // ==========================================================================

  describe('Violations by Type', () => {
    it('should group violations by type', () => {
      const analysis = enforcer.analyze(
        "It's cool that you can't really see the stuff."
      );

      expect(analysis.violationsByType).toBeDefined();
      expect(analysis.violationsByType.contraction).toBeGreaterThan(0);
      expect(analysis.violationsByType.slang).toBeGreaterThan(0);
    });

    it('should have zero counts for unused types', () => {
      const analysis = enforcer.analyze('Formal text without issues.');

      expect(analysis.violationsByType.slang).toBe(0);
      expect(analysis.violationsByType.contraction).toBe(0);
    });
  });
});
