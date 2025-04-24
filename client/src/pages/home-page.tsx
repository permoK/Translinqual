import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getConversations, createConversation } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { PlusCircle, MessageCircle, ArrowRight, Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: getConversations
  });

  const recentConversations = conversations.slice(0, 3);

  const createNewConversation = async (language: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to start a conversation",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const title = `${language} Conversation`;
      const languageCode = language === 'Maasai' ? 'mas' : 
                            language === 'Kiswahili' ? 'swa' : 
                            language === 'Kikuyu' ? 'kik' : 'eng';
      
      const newConversation = await createConversation({
        title,
        language: languageCode
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      toast({
        title: "Failed to create conversation",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Mzungumzo AI Chat Platform
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Experience the power of AI-driven conversations in Kenyan languages including Maasai, Kiswahili, Kikuyu and more
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-primary text-white"
                  onClick={() => createNewConversation('Maasai')}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Start Chatting in Maasai
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.location.href = '#languages'}
                >
                  Explore Languages
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 md:py-24 bg-gray-50 dark:bg-gray-800" id="features">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Powerful Multilingual Features
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Seamlessly communicate and learn Kenyan languages with our advanced tools
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Text Chat</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Instantly translate and learn through natural conversations with our AI in multiple Kenyan languages
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M12 6v12"></path>
                        <path d="M8 10a5 5 0 0 1 8 0"></path>
                        <path d="M8 14a5 5 0 0 0 8 0"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Voice Features</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Speak and listen with our advanced voice recognition and text-to-speech capabilities for authentic pronunciation
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Document Translation</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Upload documents and images for instant translation between English and Kenyan languages
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Handwriting Recognition</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Draw characters and phrases for instant recognition and translation with our digital drawing pad
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                        <line x1="12" x2="12" y1="3" y2="21"></line>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Side-by-Side View</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Compare original and translated text with our intuitive parallel display for better understanding
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M17.5 6H9.4a4 4 0 1 0 0 8h6.1a4 4 0 1 1 0 8H4"></path>
                        <line x1="12" x2="12" y1="2" y2="22"></line>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Cultural Context</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Get rich cultural insights alongside translations to understand the deeper meaning and context
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Languages Section */}
        <section className="py-12 md:py-24 bg-white dark:bg-gray-900" id="languages">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Supported Kenyan Languages
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Explore our growing collection of Kenyan languages and start learning today
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="overflow-hidden">
                <div className="h-2 bg-primary"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-xl font-bold">Maasai</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      The language of the Maasai people, known for their distinctive customs and dress, spoken in southern Kenya and northern Tanzania.
                    </p>
                    <div className="mt-auto pt-4">
                      <Button 
                        className="w-full"
                        onClick={() => createNewConversation('Maasai')}
                        disabled={isCreating}
                      >
                        Start Conversation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-2 bg-purple-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-xl font-bold">Kiswahili</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      One of Kenya's official languages and a lingua franca across East Africa, with over 100 million speakers worldwide.
                    </p>
                    <div className="mt-auto pt-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => createNewConversation('Kiswahili')}
                        disabled={isCreating}
                      >
                        Start Conversation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="h-2 bg-orange-500"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-xl font-bold">Kikuyu</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      The language of Kenya's largest ethnic group, the Agikuyu people, primarily spoken in the central highlands.
                    </p>
                    <div className="mt-auto pt-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => createNewConversation('Kikuyu')}
                        disabled={isCreating}
                      >
                        Start Conversation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-center mt-10">
              <Button variant="outline" size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Explore More Languages
              </Button>
            </div>
          </div>
        </section>
        
        {/* Recent Conversations Section */}
        {user && (
          <section className="py-12 md:py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold tracking-tighter">Your Recent Conversations</h2>
                <Button onClick={() => navigate("/")}>View All</Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentConversations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center text-center p-10">
                    <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Start your first conversation in any of the supported languages
                    </p>
                    <Button 
                      onClick={() => createNewConversation('Maasai')}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Start a Conversation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentConversations.map(conversation => (
                    <Card key={conversation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="pt-6" onClick={() => navigate(`/chat/${conversation.id}`)}>
                        <div className="flex items-start space-x-4">
                          <div className="rounded-full bg-primary p-2 text-white">
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{conversation.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              Language: {conversation.language === 'mas' ? 'Maasai' :
                                        conversation.language === 'swa' ? 'Kiswahili' :
                                        conversation.language === 'kik' ? 'Kikuyu' : conversation.language}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
