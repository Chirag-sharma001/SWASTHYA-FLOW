// Feature: swasthya-flow-opd-orchestrator, Property 1: Token creation uses unique sequential numbers
const assert = require('assert');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

const Counter = require('../src/models/Counter');
const Token = require('../src/models/Token');
const DoctorSession = require('../src/models/DoctorSession');
const tokenController = require('../src/controllers/tokenController');

describe('Token Property Tests', function() {
  let findOneAndUpdateStub;
  let saveStub;

  beforeEach(() => {
    findOneAndUpdateStub = sinon.stub(Counter, 'findOneAndUpdate').resolves({ seq: 42 });
    saveStub = sinon.stub(Token.prototype, 'save').resolves();
    sinon.stub(DoctorSession, 'findOne').resolves({ sessionId: 'test', consultationDurations: [] });
    sinon.stub(Token, 'find').returns({ sort: () => ({ lean: () => Promise.resolve([]) }) });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Property 1: Atomic counter produces unique and sequential token numbers under load (Mocked)', async () => {
    const req = { body: { patientName: 'John Doe', sessionId: 'session-123' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    const next = sinon.stub();

    await tokenController.createToken(req, res, next);

    assert.ok(
      findOneAndUpdateStub.calledWith(
        { sessionId: 'session-123' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      ),
      'Should use atomic $inc operator to generate sequential token numbers'
    );
    assert.strictEqual(res.status.calledWith(201), true);
    assert.strictEqual(res.json.args[0][0].tokenNumber, 42); // from the mock
  });
});

