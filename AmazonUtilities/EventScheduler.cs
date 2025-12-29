
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Scheduler;
using Amazon.Scheduler.Model;
using System;
using System.Text.Json;
using System.Threading.Tasks;


namespace AmazonUtilities
{
    public class EventScheduler
    {
        public static async Task ScheduleRetry(APIGatewayHttpApiV2ProxyRequest input)
        {
            var scheduler = new AmazonSchedulerClient();

            var delay = TimeSpan.FromMinutes(6);
            var retryTime = DateTime.UtcNow.Add(delay).ToString("yyyy-MM-ddTHH:mm:ss");

            var scheduleName = $"retry-{Guid.NewGuid()}";

            var command = new CreateScheduleRequest
            {
                Name = scheduleName,
                ScheduleExpression = $"at({retryTime})",
                FlexibleTimeWindow = new FlexibleTimeWindow
                {
                    Mode = FlexibleTimeWindowMode.OFF
                },
                Target = new Target
                {
                    Arn = "arn:aws:lambda:us-east-1:664418966079:function:WebhookHandler",
                    RoleArn = "arn:aws:iam::664418966079:role/Eventbridge_role",
                    Input = JsonSerializer.Serialize(input)
                }
            };

            await scheduler.CreateScheduleAsync(command);
            // context.Logger.LogLine($"Scheduled retry at {retryTime}");
        }
    }

}
