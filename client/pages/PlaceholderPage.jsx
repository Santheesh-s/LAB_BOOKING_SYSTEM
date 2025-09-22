import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, ArrowLeft, GraduationCap } from 'lucide-react';

/**
 * @typedef {Object} PlaceholderPageProps
 * @property {string} title - Page title
 * @property {string} description - Page description
 */

/**
 * PlaceholderPage component
 * @param {PlaceholderPageProps} props
 */
export default function PlaceholderPage({ title, description }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Lab Booking System</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-0 bg-card/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Construction className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">{title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">
                This page is currently under development. Please continue prompting to have me build out this functionality.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
