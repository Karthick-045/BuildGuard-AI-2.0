import networkx as nx
from typing import Dict, List, Tuple, Any, Optional

class SafetyGraphEngine:
    def __init__(self):
        self.graph = nx.Graph()

    def build_demo_graph(self) -> nx.Graph:
        """
        Builds the deterministic Phase 1 demo graph with:
        8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Exits, 1 Ramp.
        
        Topology carefully structured to satisfy:
        1. Exit B is the sole exit for Room A, Room B, Room C via Corridor C and Stair 1.
           Blocking Exit B disconnects Room A, Room B, Room C (matches Section 12 spec).
        2. Corridor C is an articulation point for Room A, Room B, Room C.
        3. Exit A serves Room D, Room E, Room F via Corridor West and Door Exit A.
        4. Ramp 1 serves Room G, Room H via Corridor East to Exit A.
        5. Stair 2 connects Corridor West and Corridor East as secondary redundancy.
        """
        G = nx.Graph()

        # Nodes: (id, type, label, x, y)
        nodes_data = [
            # 8 Rooms
            ("room_a", "ROOM", "Room A", 100, 100),
            ("room_b", "ROOM", "Room B", 100, 220),
            ("room_c", "ROOM", "Room C", 100, 340),
            ("room_d", "ROOM", "Room D", 600, 100),
            ("room_e", "ROOM", "Room E", 600, 220),
            ("room_f", "ROOM", "Room F", 600, 340),
            ("room_g", "ROOM", "Room G", 350, 480),
            ("room_h", "ROOM", "Room H", 500, 480),

            # 12 Doors
            ("door_a", "DOOR", "Door A", 220, 100),
            ("door_b", "DOOR", "Door B", 220, 220),
            ("door_c", "DOOR", "Door C", 220, 340),
            ("door_d", "DOOR", "Door D", 720, 100),
            ("door_e", "DOOR", "Door E", 720, 220),
            ("door_f", "DOOR", "Door F", 720, 340),
            ("door_g", "DOOR", "Door G", 350, 400),
            ("door_h", "DOOR", "Door H", 500, 400),
            ("door_exit_a", "DOOR", "Exit Door A", 850, 260),
            ("door_exit_b", "DOOR", "Exit Door B", 220, 480),
            ("door_sec_1", "DOOR", "Fire Door 1", 380, 220),
            ("door_sec_2", "DOOR", "Fire Door 2", 500, 220),

            # 4 Corridors
            ("corridor_c", "CORRIDOR", "Corridor C", 300, 220),
            ("corridor_west", "CORRIDOR", "Corridor West", 720, 220),
            ("corridor_east", "CORRIDOR", "Corridor East", 420, 340),
            ("main_hallway", "CORRIDOR", "Main Hallway", 450, 150),

            # 2 Stairs
            ("stair_1", "STAIR", "Stair 1", 220, 410),
            ("stair_2", "STAIR", "Stair 2", 580, 150),

            # 1 Ramp
            ("ramp_1", "RAMP", "Ramp 1", 420, 420),

            # 2 Exits
            ("exit_a", "EXIT", "Exit A", 950, 260),
            ("exit_b", "EXIT", "Exit B", 120, 480),
        ]

        for n_id, n_type, n_label, x, y in nodes_data:
            G.add_node(
                n_id,
                id=n_id,
                type=n_type,
                label=n_label,
                position={"x": x, "y": y},
                is_blocked=False,
                is_affected=False,
                is_bottleneck=False
            )

        # Edges (connections)
        edges_data = [
            # Rooms A, B, C -> Doors -> Corridor C
            ("room_a", "door_a", "CONNECTS_TO"),
            ("door_a", "corridor_c", "LEADS_TO"),
            ("room_b", "door_b", "CONNECTS_TO"),
            ("door_b", "corridor_c", "LEADS_TO"),
            ("room_c", "door_c", "CONNECTS_TO"),
            ("door_c", "corridor_c", "LEADS_TO"),

            # Corridor C -> Stair 1 -> Door Exit B -> Exit B
            ("corridor_c", "stair_1", "ESCAPE_ROUTE_TO"),
            ("stair_1", "door_exit_b", "LEADS_TO"),
            ("door_exit_b", "exit_b", "ESCAPE_ROUTE_TO"),

            # Rooms D, E, F -> Doors -> Corridor West
            ("room_d", "door_d", "CONNECTS_TO"),
            ("door_d", "corridor_west", "LEADS_TO"),
            ("room_e", "door_e", "CONNECTS_TO"),
            ("door_e", "corridor_west", "LEADS_TO"),
            ("room_f", "door_f", "CONNECTS_TO"),
            ("door_f", "corridor_west", "LEADS_TO"),

            # Corridor West -> Door Exit A -> Exit A
            ("corridor_west", "door_exit_a", "LEADS_TO"),
            ("door_exit_a", "exit_a", "ESCAPE_ROUTE_TO"),

            # Rooms G, H -> Doors -> Corridor East
            ("room_g", "door_g", "CONNECTS_TO"),
            ("door_g", "corridor_east", "LEADS_TO"),
            ("room_h", "door_h", "CONNECTS_TO"),
            ("door_h", "corridor_east", "LEADS_TO"),

            # Corridor East -> Ramp 1 -> Door Exit A -> Exit A
            ("corridor_east", "ramp_1", "ESCAPE_ROUTE_TO"),
            ("ramp_1", "corridor_west", "LEADS_TO"),

            # Secondary cross-corridor connection
            ("corridor_west", "stair_2", "CONNECTS_TO"),
            ("stair_2", "main_hallway", "LEADS_TO"),
            ("main_hallway", "door_sec_1", "CONNECTS_TO"),
            ("door_sec_1", "corridor_east", "LEADS_TO"),
        ]

        for u, v, rel in edges_data:
            G.add_edge(u, v, relationship=rel)

        self.graph = G
        return G

    def get_articulation_points(self, G: Optional[nx.Graph] = None) -> List[str]:
        """
        Uses networkx.articulation_points() to find critical single points of failure.
        """
        graph_to_check = G if G is not None else self.graph
        try:
            return list(nx.articulation_points(graph_to_check))
        except Exception:
            return []

    def check_connectivity(self, G: Optional[nx.Graph] = None, blocked_nodes: Optional[List[str]] = None) -> Tuple[List[Dict[str, Any]], List[str], bool]:
        """
        Checks whether each room in the graph has an unobstructed path to at least one EXIT.
        Returns:
            - connectivity_status: list of dicts for each room
            - affected_rooms: list of room labels that cannot reach any exit
            - lost_connectivity: True if at least one room is disconnected
        """
        graph_to_check = G.copy() if G is not None else self.graph.copy()
        
        if blocked_nodes:
            for b_node in blocked_nodes:
                if graph_to_check.has_node(b_node):
                    graph_to_check.remove_node(b_node)

        # Find all active exit nodes
        active_exits = [
            n for n, attr in graph_to_check.nodes(data=True) 
            if attr.get("type") == "EXIT"
        ]

        # Find all room nodes in original graph
        all_rooms = [
            (n, attr.get("label", n)) for n, attr in self.graph.nodes(data=True)
            if attr.get("type") == "ROOM"
        ]

        connectivity_status = []
        affected_rooms = []

        for room_id, room_label in all_rooms:
            can_escape = False
            nearest_exit = None
            shortest_path = []

            if graph_to_check.has_node(room_id) and active_exits:
                for exit_node in active_exits:
                    try:
                        if nx.has_path(graph_to_check, room_id, exit_node):
                            path = nx.shortest_path(graph_to_check, room_id, exit_node)
                            if not shortest_path or len(path) < len(shortest_path):
                                shortest_path = path
                                nearest_exit = graph_to_check.nodes[exit_node].get("label", exit_node)
                                can_escape = True
                    except Exception:
                        continue

            connectivity_status.append({
                "room": room_label,
                "room_id": room_id,
                "connected_to_exit": can_escape,
                "nearest_exit": nearest_exit,
                "path": shortest_path
            })

            if not can_escape:
                affected_rooms.append(room_label)

        lost_connectivity = len(affected_rooms) > 0
        return connectivity_status, affected_rooms, lost_connectivity

    def simulate_obstruction(self, target_id: str, G: Optional[nx.Graph] = None) -> Dict[str, Any]:
        """
        Simulates blocking a specific node (e.g. exit_b, corridor_c, stair_1).
        Recalculates connectivity and articulation points.
        """
        base_g = G.copy() if G is not None else self.graph.copy()
        target_norm = target_id.strip().lower()

        # Find the node matching target_id or label
        target_node = None
        for n, attr in base_g.nodes(data=True):
            if n.lower() == target_norm or attr.get("label", "").lower() == target_norm:
                target_node = n
                break

        if not target_node:
            # Fallback: check if target is partial match
            for n in base_g.nodes():
                if target_norm in n.lower():
                    target_node = n
                    break

        if not target_node:
            return {
                "success": False,
                "target": target_id,
                "action": "BLOCK",
                "lost_connectivity": False,
                "affected_rooms": [],
                "message": f"Element '{target_id}' not found in safety graph."
            }

        target_label = base_g.nodes[target_node].get("label", target_node)

        # Clone and remove target
        sim_g = base_g.copy()
        sim_g.remove_node(target_node)

        connectivity, affected_rooms, lost_connectivity = self.check_connectivity(
            G=base_g, blocked_nodes=[target_node]
        )
        new_articulation_points = self.get_articulation_points(sim_g)

        count = len(affected_rooms)
        if lost_connectivity:
            msg = f"{count} room{'s' if count != 1 else ''} lose escape connectivity."
        else:
            msg = f"All rooms retain egress access after blocking {target_label}."

        return {
            "success": True,
            "target": target_label,
            "target_node": target_node,
            "action": "BLOCK",
            "lost_connectivity": lost_connectivity,
            "affected_rooms": affected_rooms,
            "message": msg,
            "articulation_points": new_articulation_points,
            "connectivity": connectivity
        }

safety_graph_engine = SafetyGraphEngine()
safety_graph_engine.build_demo_graph()
