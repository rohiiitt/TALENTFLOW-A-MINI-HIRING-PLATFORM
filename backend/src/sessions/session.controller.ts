import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { AgentService } from '../agent/agent.service.js';

export class SessionController {
  public static async createAndRun(req: Request, res: Response): Promise<void> {
    const { prompt, userId } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Buyer prompt is required'
      });
      return;
    }

    try {
      const session = AgentService.createSession(prompt.trim(), userId || 'USER-DEV-01');
      const updatedSession = await AgentService.runInvestigation(session.id);

      const actions = db.actions.getBySessionId(session.id);

      res.status(201).json({
        success: true,
        data: {
          session: updatedSession,
          actions
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while processing session'
      });
    }
  }

  public static getById(req: Request, res: Response): void {
    const id = req.params.id as string;
    const session = db.sessions.getById(id);

    if (!session) {
      res.status(404).json({
        success: false,
        error: `Session '${id}' not found`
      });
      return;
    }

    const actions = db.actions.getBySessionId(id);
    const order = session.orderId ? db.orders.getById(session.orderId) : null;

    res.json({
      success: true,
      data: {
        session,
        actions,
        order
      }
    });
  }

  public static getActions(req: Request, res: Response): void {
    const id = req.params.id as string;
    const actions = db.actions.getBySessionId(id);

    res.json({
      success: true,
      count: actions.length,
      data: actions
    });
  }

  public static async purchase(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { deliveryAddress, simulateFailure } = req.body;

    try {
      const updatedSession = await AgentService.executePurchaseAndValidate(id, {
        deliveryAddress,
        simulateFailure: !!simulateFailure
      });

      const actions = db.actions.getBySessionId(id);
      const order = updatedSession.orderId ? db.orders.getById(updatedSession.orderId) : null;

      res.json({
        success: true,
        data: {
          session: updatedSession,
          order,
          actions
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to execute purchase'
      });
    }
  }

  public static resetData(req: Request, res: Response): void {
    db.resetToSeed();
    res.json({
      success: true,
      message: 'Database reset to default seed catalog successfully'
    });
  }
}
