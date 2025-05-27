"use client";

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Users, Phone, MapPin, Mail, Monitor, Calendar, Target, Clock, AlertCircle, Send, Bot, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Campaign types with descriptions
const campaignTypes = [
  {
    id: 'PHONE_BANK',
    name: 'Phone Bank',
    icon: Phone,
    description: 'Reach voters through organized phone calling campaigns',
    timeline: '2-4 weeks',
    color: 'bg-blue-500'
  },
  {
    id: 'CANVASSING',
    name: 'Door-to-Door Canvassing',
    icon: MapPin,
    description: 'Direct voter contact through neighborhood canvassing',
    timeline: '3-6 weeks',
    color: 'bg-green-500'
  },
  {
    id: 'GOTV',
    name: 'GOTV Drive',
    icon: Users,
    description: 'Get out the vote efforts for election day',
    timeline: '1-2 weeks',
    color: 'bg-red-500'
  },
  {
    id: 'MAIL',
    name: 'Mail Campaign',
    icon: Mail,
    description: 'Targeted direct mail to voter households',
    timeline: '4-8 weeks',
    color: 'bg-purple-500'
  },
  {
    id: 'DIGITAL',
    name: 'Digital Outreach',
    icon: Monitor,
    description: 'Email and social media voter engagement',
    timeline: '1-3 weeks',
    color: 'bg-orange-500'
  }
];

// Mock filter results for prototype
const mockFilterResults = [
  {
    id: '1',
    description: 'Young voters in Cobb County (Age 18-35)',
    voterCount: 2847,
    config: { counties: ['Cobb'], ageRange: [18, 35] }
  },
  {
    id: '2',
    description: 'Never voted active voters in Fulton County',
    voterCount: 1456,
    config: { counties: ['Fulton'], voterStatus: ['ACTIVE'], neverVoted: true }
  },
  {
    id: '3',
    description: 'High-turnout neighborhoods in DeKalb County',
    voterCount: 3241,
    config: { counties: ['DeKalb'], participationScore: [8, 10] }
  }
];

const steps = [
  { id: 1, name: 'Basic Info', description: 'Campaign details and type' },
  { id: 2, name: 'Target Voters', description: 'Select voter groups' },
  { id: 3, name: 'Scripting', description: 'Build AI-powered conversation scripts' },
  { id: 4, name: 'Review', description: 'Launch campaign' }
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    campaignManager: '',
    targetContacts: '',
    targetContactsType: 'number', // 'number' or 'percentage'
    targetContactsPercentage: '',
    responseRateGoal: '',
    volunteerHours: '',
    selectedFilters: [],
    maxContactsPerVoter: 3,
    daysBetweenAttempts: 7,
    scriptTone: 'FRIENDLY',
    aiModel: 'CHATGPT',
    scriptTemplate: '',
    chatMessages: [],
    currentChatInput: '',
    generatedScript: ''
  });

  const updateCampaignData = (field: string, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const toggleFilterSelection = (filterId: string) => {
    const currentFilters = campaignData.selectedFilters as string[];
    if (currentFilters.includes(filterId)) {
      updateCampaignData('selectedFilters', currentFilters.filter(id => id !== filterId));
    } else {
      updateCampaignData('selectedFilters', [...currentFilters, filterId]);
    }
  };

  const getTotalVoters = () => {
    return mockFilterResults
      .filter(filter => (campaignData.selectedFilters as string[]).includes(filter.id))
      .reduce((total, filter) => total + filter.voterCount, 0);
  };

  const getEstimatedTime = () => {
    const totalVoters = getTotalVoters();
    const avgTimePerContact = campaignData.type === 'PHONE_BANK' ? 5 : 
                             campaignData.type === 'CANVASSING' ? 10 : 3;
    return Math.round((totalVoters * avgTimePerContact) / 60); // hours
  };

  const handleChatSubmit = () => {
    if (!campaignData.currentChatInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: campaignData.currentChatInput
    };
    
    const updatedMessages = [...(campaignData.chatMessages as any[]), newMessage];
    updateCampaignData('chatMessages', updatedMessages);
    
    // Simulate AI response (in real implementation, this would call your AI service)
    setTimeout(() => {
      const modelName = campaignData.aiModel === 'CHATGPT' ? 'ChatGPT' : 
                       campaignData.aiModel === 'CLAUDE' ? 'Claude' :
                       campaignData.aiModel === 'GEMINI' ? 'Gemini' : 'DeepSeek';
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Using ${modelName}, I'll help you modify the script based on: "${campaignData.currentChatInput}". Let me update the script template...`
      };
      
      const finalMessages = [...updatedMessages, aiResponse];
      updateCampaignData('chatMessages', finalMessages);
      
      // Update the generated script (mock update for now)
      const currentScript = campaignData.generatedScript || campaignData.scriptTemplate || '';
      const updatedScript = currentScript + `\n\n[AI MODIFICATION BASED ON: "${campaignData.currentChatInput}"]`;
      updateCampaignData('generatedScript', updatedScript);
    }, 1000);
    
    updateCampaignData('currentChatInput', '');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={campaignData.name}
                  onChange={(e) => updateCampaignData('name', e.target.value)}
                  placeholder="Enter campaign name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Campaign Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {campaignTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = campaignData.type === type.id;
                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => updateCampaignData('type', type.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${type.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{type.name}</h3>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {type.timeline}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="campaignManager">Campaign Manager (Optional)</Label>
                <Input
                  id="campaignManager"
                  value={campaignData.campaignManager}
                  onChange={(e) => updateCampaignData('campaignManager', e.target.value)}
                  placeholder="Enter campaign manager name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={(e) => updateCampaignData('description', e.target.value)}
                  placeholder="Describe the campaign goals and strategy"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={campaignData.startDate}
                    onChange={(e) => updateCampaignData('startDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={campaignData.endDate}
                    onChange={(e) => updateCampaignData('endDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Target Contacts</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={campaignData.targetContactsType === 'number' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateCampaignData('targetContactsType', 'number')}
                      >
                        Specific Number
                      </Button>
                      <Button
                        type="button"
                        variant={campaignData.targetContactsType === 'percentage' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateCampaignData('targetContactsType', 'percentage')}
                      >
                        Percentage of Voters
                      </Button>
                    </div>
                    
                    {campaignData.targetContactsType === 'number' ? (
                      <Input
                        type="number"
                        value={campaignData.targetContacts}
                        onChange={(e) => updateCampaignData('targetContacts', e.target.value)}
                        placeholder="2500"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={campaignData.targetContactsPercentage}
                          onChange={(e) => updateCampaignData('targetContactsPercentage', e.target.value)}
                          placeholder="75"
                          min="1"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">% of target voters</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responseRate">Response Rate Goal (%)</Label>
                    <Input
                      id="responseRate"
                      type="number"
                      value={campaignData.responseRateGoal}
                      onChange={(e) => updateCampaignData('responseRateGoal', e.target.value)}
                      placeholder="65"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="volunteerHours">Volunteer Hours Goal</Label>
                    <Input
                      id="volunteerHours"
                      type="number"
                      value={campaignData.volunteerHours}
                      onChange={(e) => updateCampaignData('volunteerHours', e.target.value)}
                      placeholder="200"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-medium">Target Voter Groups</h3>
                <p className="text-sm text-muted-foreground">
                  You can start your campaign now and add specific voter groups later from the voter list page
                </p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">
                    <strong>Tip:</strong> After creating your campaign, go to the Voter List page to experiment with filters. 
                    When you find the right voter groups, you can add them to this campaign.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Quick Start Options (Optional)</Label>
              {mockFilterResults.map((filter) => {
                const isSelected = (campaignData.selectedFilters as string[]).includes(filter.id);
                return (
                  <Card
                    key={filter.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleFilterSelection(filter.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{filter.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {filter.voterCount.toLocaleString()} voters
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {filter.voterCount.toLocaleString()}
                          </Badge>
                          {isSelected && (
                            <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {(campaignData.selectedFilters as string[]).length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Initial Target Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTotalVoters().toLocaleString()} voters across {(campaignData.selectedFilters as string[]).length} filter results
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{getTotalVoters().toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Voters</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estimated contact time: {getEstimatedTime()} hours</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You can skip this step and add voter groups after creating the campaign
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Script Generation</CardTitle>
                <CardDescription>
                  Provide guidance to help AI generate scripts that match your team's approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Script Tone</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['FRIENDLY', 'FORMAL', 'URGENT'].map((tone) => (
                        <Button
                          key={tone}
                          variant={campaignData.scriptTone === tone ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateCampaignData('scriptTone', tone)}
                        >
                          {tone.charAt(0) + tone.slice(1).toLowerCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>AI Model</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { id: 'CHATGPT', name: 'ChatGPT', description: 'OpenAI GPT-4' },
                        { id: 'CLAUDE', name: 'Claude', description: 'Anthropic' },
                        { id: 'GEMINI', name: 'Gemini', description: 'Google' },
                        { id: 'DEEPSEEK', name: 'DeepSeek', description: 'DeepSeek AI' }
                      ].map((model) => (
                        <Button
                          key={model.id}
                          variant={campaignData.aiModel === model.id ? 'default' : 'outline'}
                          size="sm"
                          className="flex flex-col h-auto py-2 px-3"
                          onClick={() => updateCampaignData('aiModel', model.id)}
                        >
                          <span className="font-medium text-xs">{model.name}</span>
                          <span className="text-xs opacity-70">{model.description}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Script Input & Chat */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="scriptTemplate">Paste Your Existing Script (Optional)</Label>
                      <Textarea
                        id="scriptTemplate"
                        value={campaignData.scriptTemplate || ''}
                        onChange={(e) => updateCampaignData('scriptTemplate', e.target.value)}
                        placeholder="Paste your existing script here, or leave blank to start from scratch..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Bot className="h-5 w-5 mr-2" />
                          AI Script Assistant
                          <Badge variant="outline" className="ml-auto text-xs">
                            {campaignData.aiModel === 'CHATGPT' ? 'ChatGPT' : 
                             campaignData.aiModel === 'CLAUDE' ? 'Claude' :
                             campaignData.aiModel === 'GEMINI' ? 'Gemini' : 'DeepSeek'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Give commands to modify your script or add personalization features
                        </CardDescription>
                      </CardHeader>
                                              <CardContent>
                          {/* Quick Command Buttons */}
                          <div className="mb-3">
                            <Label className="text-xs text-muted-foreground">Quick Commands:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {[
                                "Add voter name personalization",
                                "Include voting history references", 
                                "Add demographic-based messaging",
                                "Include issue-based talking points",
                                "Add response handling for different voter types",
                                "Make it more conversational",
                                "Add healthcare focus",
                                "Include volunteer recruitment"
                              ].map((command) => (
                                <Button
                                  key={command}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 px-2"
                                  onClick={() => updateCampaignData('currentChatInput', command)}
                                >
                                  {command}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Chat Messages */}
                          <div className="h-48 overflow-y-auto border rounded-lg p-3 mb-3 bg-muted/20">
                          {(campaignData.chatMessages as any[]).length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-6">
                              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <div className="space-y-1">
                                <p>Start by pasting a script above or try a command:</p>
                                <p className="text-xs">• "Create a phone script for John Smith for Mayor"</p>
                                <p className="text-xs">• "Add voter name personalization"</p>
                                <p className="text-xs">• "Include voting history references"</p>
                                <p className="text-xs">Or click a quick command button above</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(campaignData.chatMessages as any[]).map((message: any) => (
                                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                                      {message.type === 'user' ? (
                                        <User className="h-3 w-3 text-primary-foreground" />
                                      ) : (
                                        <Bot className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div className={`p-3 rounded-lg ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                      <p className="text-sm">{message.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="flex space-x-2">
                          <Input
                            value={campaignData.currentChatInput || ''}
                            onChange={(e) => updateCampaignData('currentChatInput', e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a command or click a quick command above..."
                            className="flex-1"
                          />
                          <Button onClick={handleChatSubmit} size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Generated Script */}
                  <div>
                    <Label>AI-Generated Script (Read-Only)</Label>
                    <Textarea
                      value={campaignData.generatedScript || campaignData.scriptTemplate || 'Your AI-generated script will appear here as you give commands...'}
                      readOnly
                      className="mt-1 min-h-[400px] bg-muted/30 font-mono text-sm"
                    />
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>This script updates automatically as you chat with the AI assistant.</p>
                      <p><strong>Personalization placeholders:</strong> [VOTER_NAME], [VOTING_HISTORY], [VOTER_ISSUES], [CANDIDATE_NAME], [DEMOGRAPHIC_MESSAGE], [RESPONSE_TYPE]</p>
                      <p><strong>AI will replace these</strong> with voter-specific information during actual calls.</p>
                    </div>
                    
                    <div className="mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            View Example: Placeholders → Actual Values
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Personalization Example</DialogTitle>
                            <DialogDescription>
                              See how AI replaces placeholders with actual voter data during calls
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Before - With Placeholders */}
                            <div>
                              <h3 className="font-medium mb-2">Script Template (With Placeholders)</h3>
                              <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm whitespace-pre-line h-96 overflow-y-auto">
{`Hello! Is [VOTER_NAME] available? 

Hi [VOTER_NAME], my name is [VOLUNTEER_NAME], I'm a volunteer with [ORGANIZATION_NAME]. 

What issue is most important to you this election cycle?

[PERSONALIZED_ISSUE_RESPONSE_BASED_ON_VOTER_HISTORY]

We've got an election coming up for [OFFICE] this [ELECTION_DATE], do you know who you'll be voting for?

[If UNDECIDED]: 
Our group is supporting [CANDIDATE_NAME]. [CANDIDATE_TALKING_POINTS_BASED_ON_VOTER_ISSUES]. Can we count on your support?

Thank you for your time!`}
                              </div>
                            </div>
                            
                            {/* After - With Actual Values */}
                            <div>
                              <h3 className="font-medium mb-2">Personalized Script (For Sarah Johnson)</h3>
                              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg font-mono text-sm whitespace-pre-line h-96 overflow-y-auto">
{`Hello! Is Sarah Johnson available? 

Hi Sarah, my name is Mike Chen, I'm a volunteer with Georgia Progressive Action. 

What issue is most important to you this election cycle?

I see you've been a consistent voter in local elections but missed the last gubernatorial race. Many voters like you care deeply about education funding since you live in a district with growing schools.

We've got an election coming up for Governor this November 5th, do you know who you'll be voting for?

[If UNDECIDED]: 
Our group is supporting Maria Rodriguez. She's committed to increasing teacher pay by 15% and expanding pre-K programs, which directly impacts families in your Cobb County district. Can we count on your support?

Thank you for your time!`}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                            <p><strong>How it works:</strong> During actual calls, AI analyzes each voter's data (voting history, demographics, location) and replaces placeholders with relevant, personalized information. This creates unique, targeted conversations for every voter while maintaining your script's structure and messaging.</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Frequency Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxContacts">Max contacts per voter</Label>
                    <Input
                      id="maxContacts"
                      type="number"
                      value={campaignData.maxContactsPerVoter}
                      onChange={(e) => updateCampaignData('maxContactsPerVoter', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysBetween">Days between attempts</Label>
                    <Input
                      id="daysBetween"
                      type="number"
                      value={campaignData.daysBetweenAttempts}
                      onChange={(e) => updateCampaignData('daysBetweenAttempts', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Respect Do-Not-Call registry</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>TCPA compliance for text messages</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Honor voter contact preferences</span>
                </label>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <p className="font-medium">{campaignData.name || 'Untitled Campaign'}</p>
                  </div>
                  <div>
                    <Label>Campaign Type</Label>
                    <p className="font-medium">
                      {campaignTypes.find(t => t.id === campaignData.type)?.name || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <Label>Target Voters</Label>
                    <p className="font-medium">{getTotalVoters().toLocaleString()} voters</p>
                  </div>
                  <div>
                    <Label>Estimated Time</Label>
                    <p className="font-medium">{getEstimatedTime()} hours</p>
                  </div>
                  <div>
                    <Label>Campaign Manager</Label>
                    <p className="font-medium">{campaignData.campaignManager || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label>AI Model</Label>
                    <p className="font-medium">
                      {campaignData.aiModel === 'CHATGPT' ? 'ChatGPT' : 
                       campaignData.aiModel === 'CLAUDE' ? 'Claude' :
                       campaignData.aiModel === 'GEMINI' ? 'Gemini' : 'DeepSeek'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Script Template</CardTitle>
                <CardDescription>
                  Review your script template before launching. This will be personalized for each voter during calls.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
                  {campaignData.generatedScript || campaignData.scriptTemplate || `Hello! Is [VOTER_NAME] available? 

Hi [VOTER_NAME], my name is [VOLUNTEER_NAME], I'm a volunteer with [ORGANIZATION_NAME]. We're calling voters today to talk about the upcoming election.

What issue is most important to you this election cycle?

[PERSONALIZED_ISSUE_RESPONSE_BASED_ON_VOTER_HISTORY]

We've got an election coming up for [OFFICE] this [ELECTION_DATE], do you know who you'll be voting for?

[If UNDECIDED]: 
Our group is supporting [CANDIDATE_NAME]. [CANDIDATE_TALKING_POINTS_BASED_ON_VOTER_ISSUES]. Can we count on your support?

Thank you for your time!`}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <strong>Script Tone:</strong> {campaignData.scriptTone.charAt(0) + campaignData.scriptTone.slice(1).toLowerCase()} • 
                    <strong> AI Model:</strong> {campaignData.aiModel === 'CHATGPT' ? 'ChatGPT' : 
                                                 campaignData.aiModel === 'CLAUDE' ? 'Claude' :
                                                 campaignData.aiModel === 'GEMINI' ? 'Gemini' : 'DeepSeek'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentStep(3)}
                  >
                    Edit Script
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pre-Launch Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Campaign details configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Target voters selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Volunteers to be assigned after launch</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Compliance settings verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-4">
              <Button size="lg" className="flex-1" onClick={() => router.push('/ga/voter/campaigns')}>
                <Users className="h-4 w-4 mr-2" />
                Launch Campaign
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push('/ga/voter/campaigns')}>
                Save as Draft
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <Link href="/ga/voter/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Campaign</h1>
              <p className="text-muted-foreground">Set up a new voter outreach campaign</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-0.5 bg-muted-foreground/20" />
                )}
              </div>
            ))}
          </div>
                     <div className="mt-4">
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Step {currentStep}: {steps[currentStep - 1].name}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={currentStep === 4}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
} 