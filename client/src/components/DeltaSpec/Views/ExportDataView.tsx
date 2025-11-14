import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { exportData, getExportHistory } from '@/api/export';
import { useToast } from '@/hooks/useToast';
import { useEffect } from 'react';

interface ExportDataViewProps {
  symbol: string;
}

export function ExportDataView({ symbol }: ExportDataViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      dataType: 'trades',
      format: 'csv',
      dateFrom: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getExportHistory();
        setHistory(result.exports);
      } catch (error) {
        console.error('Failed to load export history:', error);
      }
    };

    loadHistory();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      const result = await exportData(data.dataType, data.format, {
        from: data.dateFrom,
        to: data.dateTo,
      });

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: 'Success',
        description: `Data exported as ${result.fileName}`,
      });

      // Reload history
      const historyResult = await getExportHistory();
      setHistory(historyResult.exports);

      setTimeout(() => {
        setProgress(0);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const dataType = watch('dataType');
  const format = watch('format');

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Data Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Data Type</Label>
              <RadioGroup value={dataType} onValueChange={(value) => register('dataType').onChange({ target: { value } })}>
                {['trades', 'order-book', 'delta-analysis', 'signals'].map((type) => (
                  <div key={type} className="flex items-center space-x-2 p-3 border border-border/40 rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value={type} id={type} />
                    <Label htmlFor={type} className="flex-1 cursor-pointer capitalize">
                      {type.replace('-', ' ')}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Export Format</Label>
              <RadioGroup value={format} onValueChange={(value) => register('format').onChange({ target: { value } })}>
                <div className="grid grid-cols-2 gap-4">
                  {['csv', 'json'].map((fmt) => (
                    <div key={fmt} className="flex items-center space-x-2 p-3 border border-border/40 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value={fmt} id={fmt} />
                      <Label htmlFor={fmt} className="flex-1 cursor-pointer uppercase">
                        {fmt}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-sm">
                    From
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    {...register('dateFrom')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-sm">
                    To
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    {...register('dateTo')}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Exporting...</p>
                  <p className="text-sm font-medium">{Math.round(progress)}%</p>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Export Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Export History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Exports</h3>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        <Card className="bg-card/50 border-border/40 overflow-hidden">
          {history.length === 0 ? (
            <CardContent className="py-12 text-center text-muted-foreground">
              No export history
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-accent/50">
                    <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold">Data Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Format</th>
                    <th className="px-4 py-3 text-left font-semibold">Date Range</th>
                    <th className="px-4 py-3 text-left font-semibold">File Size</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((exp) => (
                    <tr key={exp.id} className="border-b border-border/40 hover:bg-accent/30">
                      <td className="px-4 py-3 text-muted-foreground">{exp.timestamp}</td>
                      <td className="px-4 py-3">{exp.dataType}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{exp.format.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {exp.dateRange}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {exp.fileSize}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}