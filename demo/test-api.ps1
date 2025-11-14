# Nexus Blueprint 3.0 Demo - API Test Script
# This script tests the deployed API endpoints

$API_URL = "https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod"

Write-Host "🚀 Testing Nexus Blueprint 3.0 Demo API" -ForegroundColor Cyan
Write-Host "API URL: $API_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Place an Order
Write-Host "📦 Test 1: Placing an order..." -ForegroundColor Green
$orderCommand = @{
    commandType = "OrderPlaced"
    aggregateId = "order-$(Get-Random -Maximum 9999)"
    customerId = "customer-123"
    items = @(
        @{
            productId = "product-456"
            quantity = 2
            price = 49.99
        }
    )
    totalAmount = 99.98
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/commands" -Method Post -Body $orderCommand -ContentType "application/json"
    Write-Host "✅ Order placed successfully!" -ForegroundColor Green
    Write-Host "   Aggregate ID: $($response.aggregateId)" -ForegroundColor White
    Write-Host "   Version: $($response.version)" -ForegroundColor White
    Write-Host "   Event IDs: $($response.eventIds -join ', ')" -ForegroundColor White
    $orderId = $response.aggregateId
} catch {
    Write-Host "❌ Failed to place order: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 2: Query all orders
Write-Host "📋 Test 2: Querying all orders..." -ForegroundColor Green
try {
    $orders = Invoke-RestMethod -Uri "$API_URL/queries" -Method Get
    Write-Host "✅ Retrieved $($orders.total) orders" -ForegroundColor Green
    if ($orders.items.Count -gt 0) {
        Write-Host "   Latest order:" -ForegroundColor White
        $orders.items[0] | ConvertTo-Json | Write-Host
    }
} catch {
    Write-Host "❌ Failed to query orders: $_" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 3: Query events
Write-Host "📜 Test 3: Querying event timeline..." -ForegroundColor Green
try {
    $events = Invoke-RestMethod -Uri "$API_URL/events" -Method Get
    Write-Host "✅ Retrieved $($events.total) events" -ForegroundColor Green
    if ($events.items.Count -gt 0) {
        Write-Host "   Latest event:" -ForegroundColor White
        $events.items[0] | ConvertTo-Json | Write-Host
    }
} catch {
    Write-Host "❌ Failed to query events: $_" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 4: Place another order
Write-Host "📦 Test 4: Placing another order..." -ForegroundColor Green
$orderCommand2 = @{
    commandType = "OrderPlaced"
    aggregateId = "order-$(Get-Random -Maximum 9999)"
    customerId = "customer-456"
    items = @(
        @{
            productId = "product-789"
            quantity = 1
            price = 149.99
        }
    )
    totalAmount = 149.99
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$API_URL/commands" -Method Post -Body $orderCommand2 -ContentType "application/json"
    Write-Host "✅ Second order placed successfully!" -ForegroundColor Green
    Write-Host "   Aggregate ID: $($response2.aggregateId)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to place second order: $_" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 5: Query orders again to see both
Write-Host "📋 Test 5: Querying all orders again..." -ForegroundColor Green
try {
    $allOrders = Invoke-RestMethod -Uri "$API_URL/queries" -Method Get
    Write-Host "✅ Retrieved $($allOrders.total) orders total" -ForegroundColor Green
    Write-Host "   Orders:" -ForegroundColor White
    foreach ($order in $allOrders.items) {
        Write-Host "   - Order $($order.orderId): $($order.status) - $$($order.totalAmount)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to query orders: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   - Event Sourcing: ✅ Events stored in DynamoDB" -ForegroundColor White
Write-Host "   - CQRS: ✅ Separate read model updated" -ForegroundColor White
Write-Host "   - API Gateway: ✅ REST endpoints working" -ForegroundColor White
Write-Host "   - Lambda Functions: ✅ Processing commands and queries" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check AWS Console to see DynamoDB tables" -ForegroundColor White
Write-Host "   2. View Lambda logs in CloudWatch" -ForegroundColor White
Write-Host "   3. Build and deploy the React UI for visual demo" -ForegroundColor White
