#!/usr/bin/env python3
"""
Script para atualizar a lista de participantes no GitHub
Uso: python update_github.py
"""

import json
import os
import subprocess
import sys
from datetime import datetime

def update_github_repo():
    """Atualiza o repositório GitHub com as alterações na lista de participantes."""
    try:
        # Verifica se estamos em um repositório Git
        result = subprocess.run(['git', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Erro: Este diretório não é um repositório Git.")
            return False
        
        # Adiciona as alterações
        subprocess.run(['git', 'add', 'participantes.json'], check=True)
        
        # Verifica se há alterações para commit
        result = subprocess.run(['git', 'diff', '--staged', '--quiet'], capture_output=True)
        if result.returncode == 0:
            print("ℹ️  Nenhuma alteração encontrada na lista de participantes.")
            return True
        
        # Cria o commit com timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        commit_message = f"Atualização automática da lista de participantes - {timestamp}"
        
        subprocess.run(['git', 'commit', '-m', commit_message], check=True)
        print(f"✅ Commit criado: {commit_message}")
        
        # Faz o push para o GitHub
        subprocess.run(['git', 'push', 'origin', 'main'], check=True)
        print("🚀 Alterações enviadas para o GitHub com sucesso!")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar comando Git: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def validate_participants_json():
    """Valida o arquivo participantes.json."""
    try:
        with open('participantes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data.get('participantes'), list):
            print("❌ Erro: 'participantes' deve ser uma lista.")
            return False
        
        if len(data['participantes']) == 0:
            print("⚠️  Aviso: Lista de participantes está vazia.")
        
        print(f"✅ Arquivo válido com {len(data['participantes'])} participantes.")
        return True
        
    except FileNotFoundError:
        print("❌ Erro: Arquivo participantes.json não encontrado.")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Erro: JSON inválido - {e}")
        return False

def main():
    """Função principal."""
    print("🔄 Iniciando atualização do GitHub...")
    
    # Valida o arquivo JSON
    if not validate_participants_json():
        sys.exit(1)
    
    # Atualiza o GitHub
    if update_github_repo():
        print("✨ Processo concluído com sucesso!")
    else:
        print("💥 Falha na atualização.")
        sys.exit(1)

if __name__ == "__main__":
    main()
