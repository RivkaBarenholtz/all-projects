FROM mcr.microsoft.comdotnetsdk8.0 AS build-image
WORKDIR src

# Install CA certificates
RUN apt-get update && 
    apt-get install -y ca-certificates && 
    update-ca-certificates

# Copy and build
COPY . .
RUN dotnet publish -c Release -o app

FROM public.ecr.awslambdadotnet8
WORKDIR vartask

# Install CA certificates in runtime image
RUN yum install -y ca-certificates && 
    update-ca-trust force-enable

COPY --from=build-image app .
CMD [ InstechPortalInsTech_portal.FunctionFunctionHandler ]