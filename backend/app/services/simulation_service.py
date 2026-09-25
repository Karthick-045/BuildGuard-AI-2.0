from sqlalchemy.orm import Session
from app.models.simulation import SimulationRun
from app.core.safety_graph import safety_graph_engine
from app.schemas.simulation import SimulationRequest, SimulationResponse, ResetSimulationResponse

class SimulationService:
    @staticmethod
    def run_simulation(project_id: int, request: SimulationRequest, db: Session) -> SimulationResponse:
        """
        Executes what-if obstruction simulation:
        1. Copies graph
        2. Removes target element (e.g. exit_b, corridor_c, stair_1)
        3. Recalculates connectivity for all rooms
        4. Detects affected rooms
        5. Logs run to simulation_runs table
        6. Returns response matching Section 12 spec
        """
        target = request.get_target()
        action = request.action.upper()

        # Run simulation calculation via NetworkX engine
        sim_result = safety_graph_engine.simulate_obstruction(target_id=target)

        if not sim_result.get("success", False):
            return SimulationResponse(
                success=False,
                target=target,
                action=action,
                lost_connectivity=False,
                affected_rooms=[],
                message=sim_result.get("message", f"Target {target} not recognized.")
            )

        # Save record in simulation_runs
        sim_run = SimulationRun(
            project_id=project_id,
            scenario=f"What-If: {action} {sim_result['target']}",
            action=action,
            target_element=sim_result["target_node"],
            affected_rooms=sim_result["affected_rooms"],
            lost_connectivity=sim_result["lost_connectivity"],
            result=sim_result
        )
        db.add(sim_run)
        db.commit()
        db.refresh(sim_run)

        return SimulationResponse(
            success=True,
            target=sim_result["target"],
            action=action,
            lost_connectivity=sim_result["lost_connectivity"],
            affected_rooms=sim_result["affected_rooms"],
            message=sim_result["message"],
            articulation_points=sim_result.get("articulation_points", []),
            simulation_run_id=sim_run.id
        )

    @staticmethod
    def reset_simulation(project_id: int, db: Session) -> ResetSimulationResponse:
        """
        Removes simulated blockages and restores the base safety graph.
        """
        # Delete or reset active simulation runs for this project
        db.query(SimulationRun).filter(SimulationRun.project_id == project_id).delete()
        db.commit()

        return ResetSimulationResponse(
            success=True,
            message="Safety graph restored. All elements operational."
        )

simulation_service = SimulationService()
