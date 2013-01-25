/**
 * Namespace
 */
var Terminal = Terminal || {};
var Command  = Command  || {};

// Note: The file system has been prefixed as of Google Chrome 12:
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

/**
 * FilesystemErrorHandler
 */
Terminal.FilesystemErrorHandler = function(event) {
    
    // Case
    var msg = '';
    switch (event.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    }

    // Log
    console.log('Filesystem Error: ' + msg);
};

/**
 * Terminal Events
 */
Terminal.Events = function(inputElement, OutputElement) {
    
    // Set Root Pointer
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {Terminal.Filesystem.pwd = fs.root}, Terminal.FilesystemErrorHandler);
    
    // Sets
    var input = document.getElementById(inputElement);
    var body  = document.getElementById('body');
      
    // Input Keypress
    input.onkeydown = function(event) {
        if (event.which == 13 || event.keyCode == 13) {
            
            // Input Value
            var inputValue = input.value;
            var output     = new Terminal.Output(OutputElement);
            
            // Check Command Empty
            if (inputValue == '') {
                return false;
            }
            
            // Command
            var inputParse = inputValue.split(' ');
            var command    = inputParse[0].toLowerCase();
            
            // Get Command
            var commandInstance = Command.Factory.create(command);
            var fsCallback      = commandInstance.getFsCallback(inputParse, output);

            // Execute FileSystem Function
            if (!(fsCallback instanceof Terminal.Output)) {
                window.requestFileSystem(window.TEMPORARY, 1024*1024, fsCallback, Terminal.FilesystemErrorHandler);
            }
            
            // Clear Input
            input.value = '';
        }
        return true;
    };
    
    // Click Body
    body.onclick = function() {
        input.focus();
    };
};

/**
 * Output
 */
Terminal.Output = function(element) {
    
    // OutputElemen
    var outputElement = document.getElementById(element);
    
    // White
    this.write = function(content) {
        var fromContent = outputElement.innerHTML;
        fromContent += '<div class="cmd-output">';
        fromContent += content;
        fromContent += '</div>';
        outputElement.innerHTML = fromContent;
        return this;
    };
    
    this.clear = function() {
        outputElement.innerHTML = '';
        return this;
    };
};

/**
 * Terminal Filesystem Pointer
 */
Terminal.Filesystem = {
    pwd: null
};

/**
 * Command Ls
 */
Command.Ls = {
    getFsCallback: function(input, output) {
        
        // FileSystem
        return function() {

            // Read
            Terminal.Filesystem.pwd.createReader().readEntries(function(result) {
                
                // Ls Options
                var lsClass = (input[1] == '-l' ? 'filesystem-ls-l' : 'filesystem-ls');
                
                // Content
                var content = '<div class="' + lsClass+ '">';
                
                // Iteration
                for (var i = 0; i < result.length; i++) {
                    content += '<span class="' + (result[i].isFile == true ? 'is-file' : 'is-dir') + '">' + result[i].name + '</span>';
                }
                
                // Content
                content += '</div>';
                
                // Output
                output.write(content);
                
            }, Terminal.FilesystemErrorHandler);
            
        };
    }
};

/**
 * Command Mkdir
 */
Command.Mkdir = {
    getFsCallback: function(input, output) {
        
        // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');;
        }
        
        // Filesystem
        return function() {
            
            // Add Dir
            Terminal.Filesystem.pwd.getDirectory(input[1], {create: true}, function() {}, Terminal.FilesystemErrorHandler);
            
        };
    }
};

/**
 * Command Touch
 */
Command.Touch = {
    getFsCallback: function(input, output) {
        
        // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');
        }
        
        // Filesystem
        return function() {
            
            // Touch File
            Terminal.Filesystem.pwd.getFile(input[1], {create: true, exclusive: true}, function() {}, Terminal.FilesystemErrorHandler);
            
        };
    }
};


/**
 * Command Cd
 */
Command.Cd = {
    getFsCallback: function(input, output) {
         
         // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');
        }
        
        // Filesystem
        return function() {
            
            // Add directory pointer
            Terminal.Filesystem.pwd.getDirectory(input[1], {}, function(dirEntity) {
                Terminal.Filesystem.pwd = dirEntity;
            });
        };
    }
};

/**
 * Command Rm
 */
Command.Rm = {
    getFsCallback: function(input, output) {
        
        // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');
        }
        
        // Filesystem
        return function() {
            
            // Check Recusively
            if (input[1] == '-R') {
                
                // Get Dir
                Terminal.Filesystem.pwd.getDirectory(input[2], {}, function(dirEntry) {
                    
                    // Remove Dir Recursively
                    dirEntry.removeRecursively(function() {}, Terminal.FilesystemErrorHandler);

              }, Terminal.FilesystemErrorHandler);
            
            } else {
                
                // Touch File
                Terminal.Filesystem.pwd.getFile(input[1], {}, function(fileEntry) {
                    
                    // Remove File
                    fileEntry.remove(function() {}, Terminal.FilesystemErrorHandler);
                    
                }, Terminal.FilesystemErrorHandler);
            }
            
        };
    }
};

/**
 * Command Mv
 */
Command.Mv = {
    getFsCallback: function(input, output) {
        return output.write('Not implemented');
    }
};

/**
 * Command Help
 */
Command.Clear = {
    getFsCallback: function(input, output) {
        var helpContent = '';
        helpContent += '<div><strong>cd</strong>     [cd "dir"] [cd ..]         | Navigate on directories</div>';
        helpContent += '<div><strong>clear</strong>  [clear]                    | Clear the display</div>';
        helpContent += '<div><strong>ls</strong>     [ls] [ls -l]               | List files and directories</div>';
        helpContent += '<div><strong>mkdir</strong>  [mkdir "dir name"]         | Create new directory</div>';
        helpContent += '<div><strong>mv</strong>     [mv "to" "from"]           | Move the files or directories</div>';
        helpContent += '<div><strong>touch</strong>  [touch "file name"]        | Touch new file</div>';
        helpContent += '<div><strong>rm</strong>     [rm "file"] [rm -R "dir"]  | List files and directories</div>';
        return output.write(helpContent);
    }
};

/**
 * Command Clear
 */
Command.Clear = {
    getFsCallback: function(input, output) {
        return output.clear();
    }
};

/**
 * Command Not Found
 */
Command.Notfound = {
    getFsCallback: function(input, output) {
        return output.write('Not having dude');
    }
};

/**
 * Terminal CommandFactory
 */
Command.Factory = {
    commandMap : {
      'ls'    : Command.Ls,
      'cd'    : Command.Cd,
      'mkdir' : Command.Mkdir,
      'rm'    : Command.Rm,
      'mv'    : Command.Mv,
      'clear' : Command.Clear,
      'touch' : Command.Touch,
      'help'  : Command.Help
    },
  
    create: function(option) {
        if (this.commandMap[option] != null) {
            return this.commandMap[option];
        }      
        return Command.Notfound;        
    }
};

/**
 * Window Load
 */
window.onload = function() {
    new Terminal.Events('cmdline', 'output');
};