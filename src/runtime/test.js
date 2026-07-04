import {AuditEventStore} from './auditEventStore.js'
import {MemoryStateService} from './memoryStateService.js'

const studentId = 'dca4df25-7327-4995-adf8-d39a88a52624'
const store = new AuditEventStore()
const audit = await store.getAuditEventsForStudent({studentId, eventTypes: [
    'route_candidate_selected',
    'route_transition_decision',
    'route_outcome_rejected',
    'route_outcome_accepted'
]})
// console.dir(audit, {depth: null})

const memory = new MemoryStateService()
const truth = await memory.deriveCurrentTruth({studentId})
// console.dir(truth, {depth: null})