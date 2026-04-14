export default function InventoryPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Module</h1>
      <p className="text-gray-600 mb-6">
        This is a placeholder for the Inventory module. 
        Use the AI Builder to generate a complete inventory management system.
      </p>
      <a 
        href="/builder" 
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate Inventory System
      </a>
    </div>
  );
}
