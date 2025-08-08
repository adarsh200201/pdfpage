import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Trash2,
  Users,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Workflow,
  UserCheck,
  UserX,
  Calendar,
  Bell,
  Filter,
  Zap
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'sign' | 'approve' | 'review' | 'notify';
  title: string;
  assignee: string;
  email: string;
  role: string;
  dueDate?: string;
  conditions?: string[];
  reminders: {
    enabled: boolean;
    intervals: number[]; // days
  };
  parallel?: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused';
  steps: WorkflowStep[];
  triggers: string[];
  created: string;
  lastUsed?: string;
  usage: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Sales Contract Approval',
    description: 'Standard workflow for sales contracts requiring legal and management approval',
    status: 'active',
    steps: [
      {
        id: '1',
        type: 'review',
        title: 'Legal Review',
        assignee: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'Legal Counsel',
        dueDate: '3',
        reminders: { enabled: true, intervals: [1, 3] }
      },
      {
        id: '2',
        type: 'approve',
        title: 'Manager Approval',
        assignee: 'Mike Chen',
        email: 'mike@company.com',
        role: 'Sales Manager',
        dueDate: '2',
        reminders: { enabled: true, intervals: [1] }
      },
      {
        id: '3',
        type: 'sign',
        title: 'Client Signature',
        assignee: 'Client',
        email: 'client@example.com',
        role: 'Client',
        dueDate: '7',
        reminders: { enabled: true, intervals: [2, 5] }
      }
    ],
    triggers: ['document_created', 'contract_type'],
    created: '2024-01-10',
    lastUsed: '2024-01-20',
    usage: 45
  },
  {
    id: '2',
    name: 'Employee Onboarding',
    description: 'Complete onboarding workflow for new employees',
    status: 'active',
    steps: [
      {
        id: '1',
        type: 'sign',
        title: 'Employment Contract',
        assignee: 'New Employee',
        email: 'employee@company.com',
        role: 'Employee',
        dueDate: '5',
        reminders: { enabled: true, intervals: [2, 4] }
      },
      {
        id: '2',
        type: 'review',
        title: 'HR Review',
        assignee: 'Jennifer Wilson',
        email: 'jennifer@company.com',
        role: 'HR Manager',
        dueDate: '1',
        reminders: { enabled: true, intervals: [1] }
      }
    ],
    triggers: ['employee_created'],
    created: '2024-01-05',
    lastUsed: '2024-01-18',
    usage: 23
  }
];

const stepTypes = [
  { id: 'sign', label: 'Signature', icon: UserCheck, color: 'emerald' },
  { id: 'approve', label: 'Approval', icon: CheckCircle, color: 'blue' },
  { id: 'review', label: 'Review', icon: Users, color: 'purple' },
  { id: 'notify', label: 'Notification', icon: Bell, color: 'orange' }
];

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: 'Workflow description',
      status: 'draft',
      steps: [],
      triggers: [],
      created: new Date().toISOString().split('T')[0],
      usage: 0
    };
    setEditingWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const addStep = () => {
    if (!editingWorkflow) return;
    
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type: 'sign',
      title: 'New Step',
      assignee: '',
      email: '',
      role: '',
      dueDate: '3',
      reminders: { enabled: true, intervals: [1] }
    };

    setEditingWorkflow({
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep]
    });
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!editingWorkflow) return;

    setEditingWorkflow({
      ...editingWorkflow,
      steps: editingWorkflow.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    });
  };

  const removeStep = (stepId: string) => {
    if (!editingWorkflow) return;

    setEditingWorkflow({
      ...editingWorkflow,
      steps: editingWorkflow.steps.filter(step => step.id !== stepId)
    });
  };

  const saveWorkflow = () => {
    if (!editingWorkflow) return;

    const existingIndex = workflows.findIndex(w => w.id === editingWorkflow.id);
    if (existingIndex >= 0) {
      setWorkflows(workflows.map(w => w.id === editingWorkflow.id ? editingWorkflow : w));
    } else {
      setWorkflows([...workflows, editingWorkflow]);
    }

    setIsEditing(false);
    setEditingWorkflow(null);
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    const duplicated = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      status: 'draft' as const,
      created: new Date().toISOString().split('T')[0],
      usage: 0
    };
    setWorkflows([...workflows, duplicated]);
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
  };

  const getStepIcon = (type: string) => {
    const stepType = stepTypes.find(t => t.id === type);
    return stepType ? stepType.icon : Users;
  };

  const getStepColor = (type: string) => {
    const stepType = stepTypes.find(t => t.id === type);
    return stepType ? stepType.color : 'gray';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isEditing && editingWorkflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflow Builder</h1>
            <p className="text-gray-600">Create and customize document workflows</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditingWorkflow(null); }}>
              Cancel
            </Button>
            <Button onClick={saveWorkflow} className="bg-emerald-600 hover:bg-emerald-700">
              Save Workflow
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={editingWorkflow.status}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, status: e.target.value as 'active' | 'draft' | 'paused' })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editingWorkflow.description}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Workflow Steps
              </CardTitle>
              <Button onClick={addStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {editingWorkflow.steps.map((step, index) => {
                const StepIcon = getStepIcon(step.type);
                const stepColor = getStepColor(step.type);
                
                return (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${stepColor}-100 flex items-center justify-center`}>
                          <StepIcon className={`w-5 h-5 text-${stepColor}-600`} />
                        </div>
                        <div>
                          <p className="font-semibold">Step {index + 1}</p>
                          <p className="text-sm text-gray-600">{step.type}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Step Type</Label>
                        <select
                          value={step.type}
                          onChange={(e) => updateStep(step.id, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {stepTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(step.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Due Date (days)</Label>
                        <Input
                          value={step.dueDate}
                          onChange={(e) => updateStep(step.id, { dueDate: e.target.value })}
                          type="number"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label>Assignee Name</Label>
                        <Input
                          value={step.assignee}
                          onChange={(e) => updateStep(step.id, { assignee: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={step.email}
                          onChange={(e) => updateStep(step.id, { email: e.target.value })}
                          placeholder="john@company.com"
                          type="email"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input
                          value={step.role}
                          onChange={(e) => updateStep(step.id, { role: e.target.value })}
                          placeholder="Manager"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.reminders.enabled}
                          onChange={(e) => updateStep(step.id, {
                            reminders: { ...step.reminders, enabled: e.target.checked }
                          })}
                        />
                        Enable automatic reminders
                      </Label>
                    </div>

                    {index < editingWorkflow.steps.length - 1 && (
                      <div className="flex justify-center mt-4">
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}

              {editingWorkflow.steps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No steps added yet</p>
                  <p>Click "Add Step" to start building your workflow</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-gray-600">Create and manage automated document workflows</p>
        </div>
        <Button onClick={createNewWorkflow} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Workflow className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold">{workflows.length}</p>
            <p className="text-sm text-gray-600">Total Workflows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Play className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.usage, 0)}</p>
            <p className="text-sm text-gray-600">Total Usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">85%</p>
            <p className="text-sm text-gray-600">Avg Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5" />
                    {workflow.name}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{workflow.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Workflow Steps Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Steps ({workflow.steps.length})</h4>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {workflow.steps.map((step, index) => {
                      const StepIcon = getStepIcon(step.type);
                      const stepColor = getStepColor(step.type);
                      
                      return (
                        <React.Fragment key={step.id}>
                          <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-lg bg-${stepColor}-100 flex items-center justify-center mb-1`}>
                              <StepIcon className={`w-4 h-4 text-${stepColor}-600`} />
                            </div>
                            <p className="text-xs text-center">{step.title}</p>
                          </div>
                          {index < workflow.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Usage</p>
                    <p className="font-semibold">{workflow.usage} times</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Used</p>
                    <p className="font-semibold">
                      {workflow.lastUsed ? new Date(workflow.lastUsed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => { setEditingWorkflow(workflow); setIsEditing(true); }}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateWorkflow(workflow)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWorkflowStatus(workflow.id)}
                  >
                    {workflow.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <Workflow className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first workflow to automate document processes
            </p>
            <Button onClick={createNewWorkflow} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowBuilder;
