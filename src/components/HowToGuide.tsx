import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  CheckCircle,
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Upload,
  Settings,
  Download,
  Info,
  Lightbulb,
  AlertTriangle,
  Zap
} from "lucide-react";

interface HowToStep {
  title: string;
  description: string;
  details: string;
  tips?: string[];
  warning?: string;
  icon: React.ComponentType<any>;
}

interface HowToGuideProps {
  toolName: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  estimatedTime: string;
  steps: HowToStep[];
  benefits?: string[];
  troubleshooting?: { problem: string; solution: string }[];
  videoUrl?: string;
}

const HowToGuide = ({
  toolName,
  difficulty,
  estimatedTime,
  steps,
  benefits = [],
  troubleshooting = [],
  videoUrl
}: HowToGuideProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  const markComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Easy": return "text-green-600 bg-green-50 border-green-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Advanced": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Guide Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                How to Use {toolName}
              </CardTitle>
              <p className="text-gray-600 mb-4">
                Complete step-by-step guide to get the best results from our {toolName.toLowerCase()}.
              </p>
            </div>
            {videoUrl && (
              <Button variant="outline" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch Video
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={getDifficultyColor(difficulty)} variant="outline">
              {difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {estimatedTime}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              Used by 2M+ users
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              4.9/5 rating
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Why Use This Tool?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step-by-Step Instructions</CardTitle>
          <p className="text-sm text-gray-600">
            Follow these {steps.length} simple steps to complete your task.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => {
            const isExpanded = expandedStep === index;
            const isCompleted = completedSteps.has(index);
            const IconComponent = step.icon;

            return (
              <div key={index} className="border rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleStep(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">
                          Step {index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {index === 0 ? 'Start' : index === steps.length - 1 ? 'Finish' : 'Process'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markComplete(index);
                        }}
                        className={isCompleted ? 'text-green-600' : 'text-gray-400'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    {/* Detailed Instructions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detailed Instructions</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{step.details}</p>
                    </div>

                    {/* Tips */}
                    {step.tips && step.tips.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          Pro Tips
                        </h4>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-yellow-600 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warning */}
                    {step.warning && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">{step.warning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      {troubleshooting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {troubleshooting.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <h4 className="font-medium text-gray-900 mb-1">
                  Problem: {item.problem}
                </h4>
                <p className="text-sm text-gray-600">
                  Solution: {item.solution}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completion Stats */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <p className="text-sm text-gray-600">
                {completedSteps.size} of {steps.length} steps completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((completedSteps.size / steps.length) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HowToGuide;
