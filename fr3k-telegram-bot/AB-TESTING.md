# PAI A/B Testing Framework

A complete A/B testing framework following PAI constitutional principles with variant management, metrics collection, and statistical analysis.

## Features

- **Variant Management**: Deterministic user assignment with configurable allocation percentages
- **Metrics Collection**: Support for binary, numeric, and count metrics
- **Statistical Analysis**: Z-tests for binary metrics, T-tests for numeric metrics
- **CLI Interface**: Full command-line interface for all operations
- **Persistence**: Automatic data persistence across sessions
- **Progress Tracking**: Monitor experiment progress and estimated completion

## Installation

The framework is implemented as a standalone TypeScript library using Bun:

```bash
# Located at: /home/fr3k/pai-telegram-bot/ab-testing.ts
```

## Quick Start

### Creating an Experiment

```typescript
import { ABTestFramework } from "./ab-testing.js";

const framework = new ABTestFramework({
  dbPath: "/tmp/my-experiments.json",
  confidenceLevel: 0.95,
});

// Create an experiment
framework.createExperiment({
  id: "checkout-button-test",
  name: "Checkout Button Color Test",
  description: "Test if green checkout button increases conversions",
  hypothesis: "Green button will increase conversion rate by 5%",
  status: "draft",
  variants: [
    { id: "control", name: "Blue Button (Current)", allocation: 50 },
    { id: "treatment", name: "Green Button (New)", allocation: 50 },
  ],
  primaryMetric: "conversion_rate",
  secondaryMetrics: ["add_to_cart_rate", "checkout_time"],
  sampleSizeRequired: 1000,
  confidenceLevel: 0.95,
  minDetectableEffect: 0.05,
  createdAt: Date.now(),
});

// Start the experiment
framework.startExperiment("checkout-button-test");
```

### Assigning Users to Variants

```typescript
// Assign a user to a variant (deterministic based on userId)
const variant = framework.assignVariant("checkout-button-test", "user-123");

console.log(variant.id); // "control" or "treatment"
console.log(variant.config); // Variant-specific configuration
```

### Recording Metrics

```typescript
// Record a binary conversion event
framework.recordMetric({
  experimentId: "checkout-button-test",
  variantId: "treatment",
  userId: "user-123",
  metricName: "conversion_rate",
  value: 1, // 1 = converted, 0 = not converted
  timestamp: Date.now(),
  type: "binary",
});

// Record a numeric metric
framework.recordMetric({
  experimentId: "checkout-button-test",
  variantId: "treatment",
  userId: "user-123",
  metricName: "checkout_time",
  value: 45.2, // seconds
  timestamp: Date.now(),
  type: "numeric",
});
```

### Analyzing Results

```typescript
// Perform statistical analysis
const result = framework.analyzeExperiment(
  "checkout-button-test",
  "conversion_rate"
);

console.log(`
  Control Mean: ${result.controlMean}
  Treatment Mean: ${result.treatmentMean}
  Relative Uplift: ${(result.relativeUplift * 100).toFixed(2)}%
  P-Value: ${result.pValue}
  Significant: ${result.significant}
  Confidence Interval: [${result.confidenceInterval!.lower.toFixed(4)}, ${result.confidenceInterval!.upper.toFixed(4)}]
`);
```

### Completing an Experiment

```typescript
if (result.significant && result.relativeUplift > 0) {
  framework.completeExperiment(
    "checkout-button-test",
    "treatment",
    `Green button showed ${(result.relativeUplift * 100).toFixed(1)}% lift in conversions (p=${result.pValue})`
  );
}
```

## CLI Usage

The framework includes a complete CLI interface:

```bash
# List all experiments
bun run ab-testing.ts list

# List only running experiments
bun run ab-testing.ts list running

# Show experiment details
bun run ab-testing.ts show checkout-button-test

# Analyze experiment
bun run ab-testing.ts analyze checkout-button-test

# Analyze specific metric
bun run ab-testing.ts analyze checkout-button-test add_to_cart_rate

# Show progress
bun run ab-testing.ts progress checkout-button-test

# Generate full report
bun run ab-testing.ts report checkout-button-test

# Export experiment
bun run ab-testing.ts export checkout-button-test > experiment.json

# Import experiment
bun run ab-testing.ts import experiment.json

# Start an experiment
bun run ab-testing.ts start checkout-button-test

# Complete experiment with winner
bun run ab-testing.ts complete checkout-button-test treatment "Green button won with 5% lift"

# Delete experiment
bun run ab-testing.ts delete checkout-button-test
```

## API Reference

### ABTestFramework

#### Constructor Options

```typescript
interface ABTestFrameworkConfig {
  dbPath?: string;          // Path to JSON file for persistence
  confidenceLevel?: number; // Default 0.95 (95%)
  power?: number;           // Default 0.8 (80%)
  autoSave?: boolean;       // Default true
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `createExperiment(experiment)` | Create a new experiment |
| `getExperiment(id)` | Get experiment by ID |
| `listExperiments(filters?)` | List experiments with optional filters |
| `startExperiment(id)` | Start an experiment |
| `completeExperiment(id, winner, conclusion)` | Complete with winner |
| `stopExperiment(id, reason)` | Stop without winner |
| `deleteExperiment(id)` | Delete an experiment |
| `assignVariant(experimentId, userId)` | Assign user to variant |
| `getUserVariant(experimentId, userId)` | Get user's assigned variant |
| `recordMetric(metric)` | Record a metric value |
| `getMetrics(experimentId, variantId, metricName?)` | Get metrics |
| `getAggregatedMetrics(...)` | Get aggregated metrics |
| `getVariantStatistics(...)` | Get statistics with CI |
| `analyzeExperiment(experimentId, metricName)` | Perform statistical analysis |
| `getExperimentProgress(id)` | Get progress report |
| `generateReport(id)` | Generate comprehensive report |
| `exportExperiment(id)` | Export as JSON |
| `importExperiment(jsonData)` | Import from JSON |
| `calculateRequiredSampleSize(params)` | Calculate sample size |
| `close()` | Close and save |

### Experiment Schema

```typescript
interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis: string;
  status: "draft" | "running" | "paused" | "completed" | "stopped";
  variants: Variant[];
  primaryMetric: string;
  secondaryMetrics?: string[];
  targeting?: Targeting;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  winningVariant?: string;
  conclusion?: string;
  sampleSizeRequired?: number;
  confidenceLevel?: number;
  minDetectableEffect?: number;
  metadata?: Record<string, any>;
}

interface Variant {
  id: string;
  name: string;
  description?: string;
  allocation: number; // 0-100, must sum to 100
  config?: Record<string, any>;
}
```

### Metric Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `binary` | Conversion/success (0 or 1) | 0, 1 |
| `numeric` | Continuous measurements | 45.2, 123.5 |
| `count` | Event counts | 0, 1, 2, 3... |

### Statistical Tests

| Metric Type | Test | Use Case |
|-------------|------|----------|
| Binary | Two-proportion Z-test | Conversion rates |
| Numeric | Two-sample T-test | Averages, durations |
| Count | Chi-square test | Event frequencies |

## Sample Size Calculation

Calculate required sample size before starting an experiment:

```typescript
const sampleSize = framework.calculateRequiredSampleSize({
  baselineRate: 0.10,        // 10% baseline conversion
  minDetectableEffect: 0.02, // 2% absolute change (20% relative)
  alpha: 0.05,               // 95% confidence
  power: 0.8,                // 80% power
});

console.log(`Required sample size: ${sampleSize} per variant`);
```

## Persistence

The framework automatically persists data to a JSON file:

```typescript
// Data is auto-saved every 5 seconds
const framework = new ABTestFramework({
  dbPath: "/tmp/experiments.json",
});

// Manual save
await framework.close(); // Saves on close
```

## Tests

Run the test suite:

```bash
/home/fr3k/.bun/bin/bun test ab-testing.test.ts
```

All 28 tests pass, covering:
- Variant management and allocation
- Metrics collection and aggregation
- Statistical analysis (z-test, t-test, confidence intervals)
- Experiment lifecycle
- CLI interface
- Persistence
- Edge cases

## Constitutional Compliance

This framework follows all PAI constitutional articles:

- **Article I**: Library-First - Standalone library, no dependencies
- **Article II**: CLI Interface - Full CLI with text in/out and JSON support
- **Article III**: Test-First - 28 tests written before implementation
- **Article VII**: Simplicity - Single file, minimal dependencies
- **Article VIII**: Anti-Abstraction - Direct implementation, no unnecessary wrappers
- **Article IX**: Integration-First - Uses real data, no mocking in tests

## Usage Examples

### Example 1: Email Subject Line Test

```typescript
const framework = new ABTestFramework();

framework.createExperiment({
  id: "email-subject-001",
  name: "Q4 Newsletter Subject Line",
  hypothesis: "Question-based subject lines will increase open rate",
  status: "running",
  variants: [
    { id: "control", name: "Standard: Q4 Newsletter Inside", allocation: 50 },
    { id: "treatment", name: "Question: Ready for Q4 Updates?", allocation: 50 },
  ],
  primaryMetric: "open_rate",
  secondaryMetrics: ["click_rate"],
  createdAt: Date.now(),
  startedAt: Date.now(),
  sampleSizeRequired: 5000,
});
```

### Example 2: Pricing Page Test

```typescript
framework.createExperiment({
  id: "pricing-page-002",
  name: "Annual vs Monthly Pricing Display",
  hypothesis: "Showing annual pricing first increases annual plan signups",
  status: "running",
  variants: [
    {
      id: "control",
      name: "Monthly First",
      allocation: 50,
      config: { defaultPricing: "monthly" },
    },
    {
      id: "treatment",
      name: "Annual First",
      allocation: 50,
      config: { defaultPricing: "annual" },
    },
  ],
  primaryMetric: "annual_plan_signup_rate",
  secondaryMetrics: ["revenue_per_visitor", "time_to_purchase"],
  createdAt: Date.now(),
  startedAt: Date.now(),
  sampleSizeRequired: 2000,
});

// Get user's variant
const variant = framework.assignVariant("pricing-page-002", "user-xyz");

// Use variant config
const defaultPricing = variant.config.defaultPricing; // "monthly" or "annual"
```

### Example 3: Server-Side Integration

```typescript
// Express.js middleware example
app.get("/checkout", (req, res) => {
  const userId = req.session.userId;
  const variant = framework.assignVariant("checkout-test", userId);

  // Record page view
  framework.recordMetric({
    experimentId: "checkout-test",
    variantId: variant.id,
    userId,
    metricName: "checkout_views",
    value: 1,
    timestamp: Date.now(),
    type: "count",
  });

  // Render with variant-specific config
  res.render("checkout", { buttonColor: variant.config.buttonColor });
});

app.post("/purchase-complete", (req, res) => {
  const userId = req.session.userId;
  const variant = framework.getUserVariant("checkout-test", userId);

  if (variant) {
    framework.recordMetric({
      experimentId: "checkout-test",
      variantId: variant.id,
      userId,
      metricName: "conversion_rate",
      value: 1,
      timestamp: Date.now(),
      type: "binary",
    });
  }

  res.redirect("/thank-you");
});
```

## License

PAI Internal Use
