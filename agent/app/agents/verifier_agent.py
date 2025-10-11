from typing import Any, Dict
from app.schemas import ConciergeResponse
from app.tools.accessibility import ensure_accessibility
from app.tools.packing import build_packing_list
from copy import deepcopy


async def verify_and_finalize(context: Dict[str, Any], draft: Dict[str, Any]) -> ConciergeResponse:
    final = deepcopy(draft)


    # Re-assert constraints and add backups
    for day in final["itinerary"]:
        for block in day["blocks"]:
            fixed_items = []
            for it in block["items"]:
                fixed_items.append(await ensure_accessibility(it, context))
            block["items"] = fixed_items


    packing = await build_packing_list(context)


    return ConciergeResponse(
        itinerary=final["itinerary"],
        restaurants=final.get("restaurants", []),
        packing_checklist=packing,
        notes="Auto-generated: verify hours before travel"
    )