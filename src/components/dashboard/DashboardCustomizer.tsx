import { useState } from "react";
import { Settings, Plus, X, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useDashboardPreferences,
  StatCardType,
  WidgetType,
  AVAILABLE_STAT_CARDS,
  AVAILABLE_WIDGETS,
} from "@/hooks/useDashboardPreferences";

export function DashboardCustomizer() {
  const {
    layout,
    addStatCard,
    removeStatCard,
    reorderStatCards,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefaults,
  } = useDashboardPreferences();

  const [isOpen, setIsOpen] = useState(false);

  const availableStatCardsToAdd = AVAILABLE_STAT_CARDS.filter(
    (card) => !layout.statsCards.includes(card.id)
  );

  const availableWidgetsToAdd = AVAILABLE_WIDGETS.filter(
    (widget) => !layout.widgets.includes(widget.id)
  );

  const currentStatCards = layout.statsCards
    .map((id) => AVAILABLE_STAT_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  const currentWidgets = layout.widgets
    .map((id) => AVAILABLE_WIDGETS.find((w) => w.id === id))
    .filter(Boolean);

  const categoryColors: Record<string, string> = {
    projects: "bg-blue-100 text-blue-800",
    tickets: "bg-red-100 text-red-800",
    crm: "bg-green-100 text-green-800",
    team: "bg-purple-100 text-purple-800",
    emails: "bg-orange-100 text-orange-800",
    tasks: "bg-yellow-100 text-yellow-800",
  };

  const moveStatCard = (index: number, direction: "up" | "down") => {
    const newCards = [...layout.statsCards];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newCards.length) return;
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
    reorderStatCards(newCards);
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    const newWidgets = [...layout.widgets];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newWidgets.length) return;
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
    reorderWidgets(newWidgets);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="border-2">
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b-2 pb-4 mb-4">
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>
            Add, remove, and reorder widgets to personalize your dashboard.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full border-2 mb-4">
            <TabsTrigger value="stats" className="flex-1">Stats Cards</TabsTrigger>
            <TabsTrigger value="widgets" className="flex-1">Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            {/* Current stat cards */}
            <div>
              <h4 className="text-sm font-medium mb-2">Current Cards ({currentStatCards.length})</h4>
              {currentStatCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stat cards added yet</p>
              ) : (
                <div className="space-y-2">
                  {currentStatCards.map((card, index) => (
                    <Card key={card!.id} className="border-2">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveStatCard(index, "up")}
                            disabled={index === 0}
                          >
                            <GripVertical className="h-3 w-3 rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveStatCard(index, "down")}
                            disabled={index === currentStatCards.length - 1}
                          >
                            <GripVertical className="h-3 w-3 rotate-90" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{card!.title}</span>
                            <Badge className={categoryColors[card!.category]} variant="secondary">
                              {card!.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{card!.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeStatCard(card!.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Available stat cards to add */}
            <div>
              <h4 className="text-sm font-medium mb-2">Available Cards</h4>
              {availableStatCardsToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground">All cards have been added</p>
              ) : (
                <div className="grid gap-2">
                  {availableStatCardsToAdd.map((card) => (
                    <Card
                      key={card.id}
                      className="border-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => addStatCard(card.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{card.title}</span>
                            <Badge className={categoryColors[card.category]} variant="secondary">
                              {card.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{card.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            {/* Current widgets */}
            <div>
              <h4 className="text-sm font-medium mb-2">Current Widgets ({currentWidgets.length})</h4>
              {currentWidgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No widgets added yet</p>
              ) : (
                <div className="space-y-2">
                  {currentWidgets.map((widget, index) => (
                    <Card key={widget!.id} className="border-2">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveWidget(index, "up")}
                            disabled={index === 0}
                          >
                            <GripVertical className="h-3 w-3 rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveWidget(index, "down")}
                            disabled={index === currentWidgets.length - 1}
                          >
                            <GripVertical className="h-3 w-3 rotate-90" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{widget!.title}</span>
                            <Badge className={categoryColors[widget!.category]} variant="secondary">
                              {widget!.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{widget!.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeWidget(widget!.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Available widgets to add */}
            <div>
              <h4 className="text-sm font-medium mb-2">Available Widgets</h4>
              {availableWidgetsToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground">All widgets have been added</p>
              ) : (
                <div className="grid gap-2">
                  {availableWidgetsToAdd.map((widget) => (
                    <Card
                      key={widget.id}
                      className="border-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => addWidget(widget.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{widget.title}</span>
                            <Badge className={categoryColors[widget.category]} variant="secondary">
                              {widget.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{widget.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-2"
            onClick={() => {
              resetToDefaults();
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
