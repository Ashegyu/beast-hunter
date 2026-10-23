/* Legacy focus hook for the existing menu actions. It creates no controls,
 * wrappers, columns, or screen pages. Item paging is owned by app.js. */
export function createMenuNavigation(){
 const inInventory=node=>node?.id==='inventory-content'||!!node?.closest?.('#inventory-content');
 return {
  first(root){if(root&&!inInventory(root))root.scrollTop=0;},
  reveal(node){if(node&&!inInventory(node))node.scrollIntoView?.({block:'start'});}
 };
}
if(typeof window!=='undefined')window.hunterPages=createMenuNavigation();
