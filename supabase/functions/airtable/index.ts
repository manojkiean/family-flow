 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
 const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');
 const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
 
 interface AirtableRecord {
   id: string;
   fields: Record<string, unknown>;
 }
 
 async function fetchFromAirtable(table: string, options?: { filterByFormula?: string }) {
   let url = `${AIRTABLE_URL}/${encodeURIComponent(table)}`;
   if (options?.filterByFormula) {
     url += `?filterByFormula=${encodeURIComponent(options.filterByFormula)}`;
   }
   
   const response = await fetch(url, {
     headers: {
       'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
       'Content-Type': 'application/json',
     },
   });
   
   if (!response.ok) {
     const error = await response.text();
     throw new Error(`Airtable API error: ${response.status} - ${error}`);
   }
   
   return response.json();
 }
 
 async function createRecord(table: string, fields: Record<string, unknown>) {
   const response = await fetch(`${AIRTABLE_URL}/${encodeURIComponent(table)}`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ fields }),
   });
   
   if (!response.ok) {
     const error = await response.text();
     throw new Error(`Airtable API error: ${response.status} - ${error}`);
   }
   
   return response.json();
 }
 
 async function updateRecord(table: string, recordId: string, fields: Record<string, unknown>) {
   const response = await fetch(`${AIRTABLE_URL}/${encodeURIComponent(table)}/${recordId}`, {
     method: 'PATCH',
     headers: {
       'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ fields }),
   });
   
   if (!response.ok) {
     const error = await response.text();
     throw new Error(`Airtable API error: ${response.status} - ${error}`);
   }
   
   return response.json();
 }
 
 async function deleteRecord(table: string, recordId: string) {
   const response = await fetch(`${AIRTABLE_URL}/${encodeURIComponent(table)}/${recordId}`, {
     method: 'DELETE',
     headers: {
       'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
       'Content-Type': 'application/json',
     },
   });
   
   if (!response.ok) {
     const error = await response.text();
     throw new Error(`Airtable API error: ${response.status} - ${error}`);
   }
   
   return response.json();
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
       throw new Error('Airtable credentials not configured');
     }
 
     const { action, table, recordId, fields, filterByFormula } = await req.json();
 
     let result;
 
     switch (action) {
       case 'list':
         result = await fetchFromAirtable(table, { filterByFormula });
         break;
       case 'create':
         result = await createRecord(table, fields);
         break;
       case 'update':
         result = await updateRecord(table, recordId, fields);
         break;
       case 'delete':
         result = await deleteRecord(table, recordId);
         break;
       default:
         throw new Error(`Unknown action: ${action}`);
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Airtable function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
       { 
         status: 500, 
         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       }
     );
   }
 });