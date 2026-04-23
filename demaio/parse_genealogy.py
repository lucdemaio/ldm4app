#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser GEDCOM - De Maio Genealogy
Estrae i dati e calcola i gradi di parentela
"""

import re
import json
from datetime import datetime
from pathlib import Path

class GedcomParser:
    def __init__(self, filepath):
        self.filepath = filepath
        self.individuals = {}
        self.families = {}
        self.parse()
        
    def parse(self):
        """Parsa il file GEDCOM"""
        with open(self.filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        current_person = None
        current_family = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            parts = line.split(' ', 2)
            level = int(parts[0])
            
            if level == 0:
                tag = parts[1] if len(parts) > 1 else ""
                value = parts[2] if len(parts) > 2 else ""
                
                if tag == "INDI":
                    current_person = {"id": value, "name": "", "sex": "", "birth": {}, "death": {}, 
                                    "fams": [], "famc": "", "notes": []}
                    self.individuals[value] = current_person
                    current_family = None
                    
                elif tag == "FAM":
                    current_family = {"id": value, "husband": "", "wife": "", "children": [], "marriage": {}}
                    self.families[value] = current_family
                    current_person = None
                    
            elif level == 1 and current_person:
                tag = parts[1] if len(parts) > 1 else ""
                
                if tag == "NAME":
                    name = parts[2] if len(parts) > 2 else ""
                    name = name.replace('/', '')
                    current_person["name"] = name.strip()
                elif tag == "SEX":
                    current_person["sex"] = parts[2] if len(parts) > 2 else ""
                elif tag == "BIRT":
                    pass
                elif tag == "DEAT":
                    pass
                elif tag == "FAMC":
                    current_person["famc"] = parts[2] if len(parts) > 2 else ""
                elif tag == "FAMS":
                    current_person["fams"].append(parts[2] if len(parts) > 2 else "")
                    
            elif level == 2 and current_person and parts[1] == "DATE":
                date_str = parts[2] if len(parts) > 2 else ""
                if "BIRT" in line or (level > 0 and "BIRT" in lines[lines.index(line)-1] if lines.index(line) > 0 else False):
                    current_person["birth"]["date"] = date_str
                elif "DEAT" in line:
                    current_person["death"]["date"] = date_str
                    
            elif level == 1 and current_family:
                tag = parts[1] if len(parts) > 1 else ""
                
                if tag == "HUSB":
                    current_family["husband"] = parts[2] if len(parts) > 2 else ""
                elif tag == "WIFE":
                    current_family["wife"] = parts[2] if len(parts) > 2 else ""
                elif tag == "CHIL":
                    current_family["children"].append(parts[2] if len(parts) > 2 else "")
                elif tag == "MARR":
                    pass
                    
    def get_relationship(self, person_id, root_id="@I112211670070@"):
        """Calcola il grado di parentela rispetto a root_id (Luca)"""
        if person_id == root_id:
            return "Tu"
        
        # BFS per trovare il percorso
        visited = set()
        queue = [(root_id, "")]
        parent_map = {root_id: None}
        relationship_map = {root_id: "Tu"}
        
        while queue:
            current_id, path = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)
            
            if current_id not in self.individuals:
                continue
                
            person = self.individuals[current_id]
            
            # Genitori
            if person["famc"]:
                family = self.families.get(person["famc"], {})
                for parent_id in [family.get("husband"), family.get("wife")]:
                    if parent_id and parent_id not in visited:
                        queue.append((parent_id, path + "↑"))
                        if parent_id not in relationship_map:
                            relationship_map[parent_id] = self._format_relationship(path + "↑")
                            
            # Figli
            for family_id in person["fams"]:
                family = self.families.get(family_id, {})
                for child_id in family.get("children", []):
                    if child_id and child_id not in visited:
                        queue.append((child_id, path + "↓"))
                        if child_id not in relationship_map:
                            relationship_map[child_id] = self._format_relationship(path + "↓")
                            
            # Fratelli (stessi genitori)
            if person["famc"]:
                family = self.families.get(person["famc"], {})
                for sibling_id in family.get("children", []):
                    if sibling_id and sibling_id != current_id and sibling_id not in visited:
                        queue.append((sibling_id, path + "="))
                        if sibling_id not in relationship_map:
                            relationship_map[sibling_id] = self._format_relationship(path + "=")
            
            if person_id in relationship_map:
                return relationship_map[person_id]
        
        return "Parente lontano"
    
    def _format_relationship(self, code):
        """Formatta il codice di parentela"""
        if code == "":
            return "Tu"
        
        up = code.count("↑")
        down = code.count("↓")
        same = code.count("=")
        
        if up == 1 and down == 0 and same == 0:
            return "Genitore"
        elif up == 0 and down == 1 and same == 0:
            return "Figlio/a"
        elif up == 2 and down == 0 and same == 0:
            return "Nonno/a"
        elif up == 0 and down == 2 and same == 0:
            return "Nipote"
        elif up == 3 and down == 0 and same == 0:
            return "Bisnonno/a"
        elif up == 0 and down == 3 and same == 0:
            return "Bisnipote"
        elif up == 1 and same == 1 and down == 0:
            return "Zio/a"
        elif same == 1 and up == 0 and down == 0:
            return "Fratello/Sorella"
        elif up == 1 and same == 1 and down == 1:
            return "Cugino/a"
        elif up == 2 and same == 1 and down == 0:
            return "Prozio/a"
        elif up == 1 and down == 1 and same == 1:
            return "Cugino/a (1°)"
        else:
            return f"Parente ({code})"
    
    def export_json(self, output_path):
        """Esporta i dati in JSON con gradi di parentela"""
        data = {
            "total_individuals": len(self.individuals),
            "total_families": len(self.families),
            "people": []
        }
        
        for person_id, person in self.individuals.items():
            relationship = self.get_relationship(person_id)
            age = self._calculate_age(person)
            
            data["people"].append({
                "id": person_id,
                "name": person["name"],
                "sex": person["sex"],
                "birth": person["birth"].get("date", "?"),
                "death": person["death"].get("date", ""),
                "age": age,
                "relationship": relationship,
                "famc": person["famc"],
                "fams": person["fams"]
            })
        
        # Ordina per relazione (parenti più stretti prima)
        order = {"Tu": 0, "Genitore": 1, "Fratello/Sorella": 2, "Figlio/a": 3, 
                "Nonno/a": 4, "Nipote": 5, "Zio/a": 6, "Cugino/a": 7}
        data["people"].sort(key=lambda x: (order.get(x["relationship"], 999), x["name"]))
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return data
    
    def _calculate_age(self, person):
        """Calcola l'età di una persona"""
        birth_str = person["birth"].get("date", "")
        if not birth_str:
            return ""
        
        try:
            # Estrai l'anno
            year_match = re.search(r'\d{4}', birth_str)
            if not year_match:
                return ""
            
            birth_year = int(year_match.group())
            death_str = person["death"].get("date", "")
            
            if death_str:
                death_match = re.search(r'\d{4}', death_str)
                if death_match:
                    death_year = int(death_match.group())
                    return f"{death_year - birth_year} anni (†{death_year})"
            else:
                current_year = 2026
                age = current_year - birth_year
                return f"{age} anni"
        except:
            return ""


if __name__ == "__main__":
    ged_file = r"C:\Users\Luca\Desktop\luca\albero genealogico\albero luca de maio 7 giugno 2023.ged"
    json_output = r"C:\Users\Luca\Desktop\luca\albero genealogico\persone_genealogia.json"
    
    print("🔍 Parsing GEDCOM...")
    parser = GedcomParser(ged_file)
    
    print(f"✅ Trovate {len(parser.individuals)} persone")
    print(f"✅ Trovate {len(parser.families)} famiglie")
    
    print(f"\n💾 Esportando JSON a {json_output}...")
    data = parser.export_json(json_output)
    
    print(f"✅ JSON creato con {len(data['people'])} persone")
    print("\n🎯 Prime 5 persone:")
    for person in data["people"][:5]:
        print(f"   {person['name']:30} - {person['relationship']:15} ({person['birth']})")
    
    print("\n✨ Parsing completato!")
