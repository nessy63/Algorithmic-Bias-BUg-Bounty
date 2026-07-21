import { SandboxResult } from '../types';
import prisma from '../config/database';

const SANDBOX_API_URL = process.env.SANDBOX_API_URL || 'http://localhost:8000';
const SANDBOX_TIMEOUT = parseInt(process.env.SANDBOX_TIMEOUT || '30000');

export class AIProxyService {
  static async testModel(
    modelId: string,
    input: string,
    testType: string
  ): Promise<SandboxResult> {
    const model = await prisma.aIModel.findUnique({ where: { id: modelId } });

    if (!model || !model.apiEndpoint) {
      throw new Error('Model not found or has no API endpoint');
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${SANDBOX_API_URL}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_endpoint: model.apiEndpoint,
          input,
          test_type: testType,
        }),
        signal: AbortSignal.timeout(SANDBOX_TIMEOUT),
      });

      const result = await response.json();

      return {
        success: true,
        output: result.output,
        executionTime: Date.now() - startTime,
        metrics: result.metrics,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sandbox execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  static async runBiasTest(
    modelId: string,
    input: string,
    biasType: string
  ): Promise<SandboxResult> {
    return this.testModel(modelId, input, `bias_${biasType}`);
  }
}
