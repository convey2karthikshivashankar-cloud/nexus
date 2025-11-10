#!/bin/bash

# Deploy AWS Glue Schema Registry Stack
# This script deploys the Schema Registry as part of the governance-first architecture

set -e

echo "=========================================="
echo "Nexus Blueprint - Schema Registry Deployment"
echo "=========================================="
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' first"
    exit 1
fi

# Get AWS account and region
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "📋 Deployment Configuration:"
echo "   AWS Account: $AWS_ACCOUNT"
echo "   AWS Region: $AWS_REGION"
echo ""

# Navigate to infrastructure package
cd "$(dirname "$0")/../packages/infrastructure"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Bootstrap CDK if needed
echo "🔧 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION &> /dev/null; then
    echo "⚠️  CDK not bootstrapped. Bootstrapping now..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
    echo ""
fi

# Synthesize the stack
echo "🔨 Synthesizing CloudFormation template..."
cdk synth NexusSchemaRegistryStack
echo ""

# Deploy the stack
echo "🚀 Deploying Schema Registry Stack..."
echo "   This will create:"
echo "   - AWS Glue Schema Registry (nexus-event-schema-registry)"
echo "   - IAM Role for Lambda functions"
echo "   - CloudFormation outputs for integration"
echo ""

cdk deploy NexusSchemaRegistryStack --require-approval never

echo ""
echo "✅ Schema Registry deployed successfully!"
echo ""

# Get stack outputs
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name NexusSchemaRegistryStack \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "🎯 Next Steps:"
echo "   1. Register your first event schema (see docs/SCHEMA_REGISTRY_SETUP.md)"
echo "   2. Deploy Policy Engine (Task 4.2)"
echo "   3. Integrate schema validation in Command Service (Task 5.1)"
echo ""
echo "📚 Documentation: packages/infrastructure/docs/SCHEMA_REGISTRY_SETUP.md"
echo ""
